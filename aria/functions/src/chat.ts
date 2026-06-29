import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import * as admin from 'firebase-admin'
import Anthropic from '@anthropic-ai/sdk'
import { buildAriaSystemPrompt } from './prompts/ariaSystem'
import { validateISODatetime } from './tools/dateTimeResolver'
import { ARIA_TOOLS, isAriaTool } from './tools/toolDefinitions'
import { ActionEngine } from './action-engine'
import { runIntelligencePipeline } from './intelligence'
import { getPluginTools, executePluginTool } from './plugins'
import type { ChatWithAriaRequest, ChatWithAriaResponse, ActionMetadata } from './types'

const anthropicApiKey = defineSecret('ANTHROPIC_API_KEY')
const MAX_HISTORY = 20

export const chatWithAria = onCall(
  { secrets: [anthropicApiKey], timeoutSeconds: 90, memory: '512MiB' },
  async (request: CallableRequest<ChatWithAriaRequest>): Promise<ChatWithAriaResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.')
    }

    const { message, sessionId, history = [] } = request.data

    if (!message?.trim()) {
      throw new HttpsError('invalid-argument', 'Message is required.')
    }
    if (!sessionId?.trim()) {
      throw new HttpsError('invalid-argument', 'Session ID is required.')
    }

    const userId = request.auth.uid
    const db = admin.firestore()
    const now = admin.firestore.Timestamp.now()

    // Fallback display name from auth token (Intelligence Pipeline may override with profile)
    const authDisplayName = request.auth.token?.name as string | undefined

    const trimmedHistory = history.slice(-MAX_HISTORY)

    // ── Intelligence Pipeline ─────────────────────────────────────────────────
    // Builds system prompt with context + memory + recommendations.
    // Replaces manual profile + contact context loading from previous phases.
    const systemBase = buildAriaSystemPrompt(undefined, authDisplayName)

    let systemPrompt = systemBase
    let userDisplayName = authDisplayName
    let intelligenceMetrics: Record<string, unknown> = {}

    try {
      const pipeline = await runIntelligencePipeline({
        userId,
        db,
        message,
        history: trimmedHistory,
        systemBase,
      })

      systemPrompt = pipeline.assembledSystemPrompt
      userDisplayName = pipeline.context.userDisplayName ?? authDisplayName
      intelligenceMetrics = {
        execMs: pipeline.metrics.executionTimeMs,
        cacheHits: pipeline.metrics.cacheHits,
        memBlocks: pipeline.metrics.memoryBlocksUsed,
        promptChars: pipeline.metrics.promptSizeChars,
        decisions: pipeline.metrics.decisionCount,
      }
    } catch {
      // Non-fatal — fall back to base system prompt, log metrics as empty
    }

    const apiKey = anthropicApiKey.value()
    if (!apiKey) {
      throw new HttpsError('internal', 'AI service not configured.')
    }

    const anthropic = new Anthropic({ apiKey })

    const claudeMessages: Anthropic.MessageParam[] = [
      ...trimmedHistory.map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user', content: message },
    ]

    // Merge core ARIA tools with any plugin-contributed tools
    const pluginToolDefs = await getPluginTools(db, userId).catch(() => [])
    const allTools: Anthropic.Tool[] = [
      ...ARIA_TOOLS,
      ...pluginToolDefs.map((pt) => ({
        name: pt.name,
        description: pt.description,
        input_schema: pt.inputSchema as Anthropic.Tool['input_schema'],
      })),
    ]

    // First Claude call — include tools so Claude can detect intent
    const firstResponse = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      system: systemPrompt,
      tools: allTools,
      messages: claudeMessages,
    })

    let reply: string
    const actionResults: ActionMetadata[] = []

    if (firstResponse.stop_reason === 'tool_use') {
      const toolUseBlock = firstResponse.content.find(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      )

      const isPluginTool = pluginToolDefs.some((pt) => pt.name === toolUseBlock?.name)

      if (toolUseBlock && isPluginTool) {
        const pluginResult = await executePluginTool(toolUseBlock.name, toolUseBlock.input as Record<string, unknown>, userId, db)
        const toolResultContent = JSON.stringify(pluginResult)
        actionResults.push({ name: toolUseBlock.name, success: pluginResult.success, actionId: toolUseBlock.id, message: pluginResult.error ?? 'Plugin tool executed' })

        const secondResponse = await anthropic.messages.create({
          model: 'claude-opus-4-8',
          max_tokens: 512,
          system: systemPrompt,
          messages: [
            ...claudeMessages,
            { role: 'assistant', content: firstResponse.content },
            { role: 'user', content: [{ type: 'tool_result' as const, tool_use_id: toolUseBlock.id, content: toolResultContent }] },
          ],
        })
        reply = secondResponse.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map((b) => b.text).join('')
      } else if (toolUseBlock && isAriaTool(toolUseBlock.name)) {
        const toolArgs = toolUseBlock.input as Record<string, unknown>

        // Validate datetime fields before passing to Action Engine
        let validationError: string | null = null
        if (typeof toolArgs.scheduledAt === 'string') {
          validationError = validateISODatetime(toolArgs.scheduledAt)
        } else if (typeof toolArgs.dueAt === 'string') {
          validationError = validateISODatetime(toolArgs.dueAt)
        }

        let toolResultContent: string

        if (validationError) {
          toolResultContent = JSON.stringify({ error: validationError })
          actionResults.push({
            name: toolUseBlock.name,
            success: false,
            actionId: toolUseBlock.id,
            message: validationError,
          })
        } else {
          const actionResult = await ActionEngine.run({
            toolName: toolUseBlock.name,
            args: toolArgs,
            userId,
            userDisplayName,
            db,
          })

          toolResultContent = JSON.stringify({
            success: actionResult.success,
            message: actionResult.message,
            data: actionResult.data,
          })

          actionResults.push({
            name: toolUseBlock.name,
            success: actionResult.success,
            actionId: actionResult.actionId,
            message: actionResult.message,
          })
        }

        // Second Claude call with tool_result — get the final user-facing reply
        const secondResponse = await anthropic.messages.create({
          model: 'claude-opus-4-8',
          max_tokens: 512,
          system: systemPrompt,
          messages: [
            ...claudeMessages,
            { role: 'assistant', content: firstResponse.content },
            {
              role: 'user',
              content: [
                {
                  type: 'tool_result' as const,
                  tool_use_id: toolUseBlock.id,
                  content: toolResultContent,
                },
              ],
            },
          ],
        })

        reply = secondResponse.content
          .filter((b): b is Anthropic.TextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('')
      } else {
        // Unrecognised tool — fall back to any text in the response
        reply = firstResponse.content
          .filter((b): b is Anthropic.TextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('')
      }
    } else {
      // Normal conversational response — no tool call needed
      reply = firstResponse.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('')
    }

    // Persist messages via admin SDK (bypasses Firestore rules that block client writes)
    const batch = db.batch()
    const sessionRef = db
      .collection('users')
      .doc(userId)
      .collection('chatSessions')
      .doc(sessionId)
    const messagesRef = sessionRef.collection('messages')

    const userMsgRef = messagesRef.doc()
    batch.set(userMsgRef, {
      role: 'user',
      content: message,
      timestamp: now,
      sessionId,
      userId,
    })

    const ariaMsgRef = messagesRef.doc()
    const ariaMsgDoc: Record<string, unknown> = {
      role: 'assistant',
      content: reply,
      timestamp: admin.firestore.Timestamp.fromMillis(now.toMillis() + 1),
      sessionId,
      userId,
    }
    if (actionResults.length > 0) {
      ariaMsgDoc.toolUsed = true
      ariaMsgDoc.tools = actionResults
    }
    batch.set(ariaMsgRef, ariaMsgDoc)

    batch.set(
      sessionRef,
      {
        userId,
        updatedAt: now,
        lastMessage: reply.slice(0, 120),
        messageCount: admin.firestore.FieldValue.increment(2),
        ...(Object.keys(intelligenceMetrics).length > 0 && { lastIntelligenceMetrics: intelligenceMetrics }),
      },
      { merge: true }
    )

    await batch.commit()

    const response: ChatWithAriaResponse = {
      reply,
      sessionId,
      messageId: ariaMsgRef.id,
    }
    if (actionResults.length > 0) {
      response.actionResults = actionResults
    }
    return response
  }
)
