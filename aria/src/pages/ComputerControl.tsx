import { useState, useRef } from 'react'
import ComputerControlDashboard from './devtools/ComputerControlDashboard'
import LiveComputerAuditFeed from '../components/computer-control/LiveComputerAuditFeed'
import { listMyTenants, type TenantRecord } from '../lib/securityService'
import {
  planComputerAction,
  requestComputerApproval,
  analyzeSelectedDocument,
  generateComputerActionSummary,
  fileToBase64,
  type ComputerActionPlan,
  type ComputerActionStep,
  type DocumentAnalysisResult,
  type ComputerActionSummary,
} from '../lib/computerControlService'
import { useEffect } from 'react'

const RISK_COLORS: Record<string, string> = {
  low:      'text-green-400 border-green-700/40 bg-green-900/20',
  medium:   'text-yellow-400 border-yellow-700/40 bg-yellow-900/20',
  high:     'text-orange-400 border-orange-700/40 bg-orange-900/20',
  critical: 'text-red-400 border-red-700/40 bg-red-900/20',
}

/**
 * Main user-facing Computer Control page (Phase 5.6).
 * Adds: intent input, plan preview, file picker, document analysis,
 * suggestion display, approval status, execution results, and live audit feed.
 */
export default function ComputerControl() {
  const [tenants, setTenants] = useState<TenantRecord[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState('')

  // Planning
  const [intent, setIntent] = useState('')
  const [plan, setPlan] = useState<ComputerActionPlan | null>(null)
  const [planSummary, setPlanSummary] = useState<ComputerActionSummary | null>(null)
  const [planBusy, setPlanBusy] = useState(false)
  const [planError, setPlanError] = useState('')
  const [_pendingStep, setPendingStep] = useState<ComputerActionStep | null>(null)
  const [approvalIds, setApprovalIds] = useState<Record<number, string>>({})
  const [approvalBusy, setApprovalBusy] = useState(false)

  // File picker + document analysis
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [docResult, setDocResult] = useState<DocumentAnalysisResult | null>(null)
  const [docError, setDocError] = useState('')

  // General errors
  const [error, setError] = useState('')

  useEffect(() => {
    void loadTenants()
  }, [])

  async function loadTenants() {
    try {
      const t = await listMyTenants()
      setTenants(t)
      if (t.length > 0) setSelectedTenantId(t[0].tenantId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tenants')
    }
  }

  async function handlePlan() {
    if (!selectedTenantId || !intent.trim()) return
    setPlanBusy(true)
    setPlanError('')
    setPlan(null)
    setPlanSummary(null)
    try {
      const result = await planComputerAction(selectedTenantId, intent)
      setPlan(result)
      // Also generate a human-readable summary
      try {
        const summary = await generateComputerActionSummary(result)
        setPlanSummary(summary)
      } catch { /* non-critical */ }
    } catch (e) {
      setPlanError(e instanceof Error ? e.message : 'Planning failed')
    } finally {
      setPlanBusy(false)
    }
  }

  async function handleRequestApproval(step: ComputerActionStep) {
    if (!plan || !selectedTenantId) return
    setApprovalBusy(true)
    try {
      const result = await requestComputerApproval({
        tenantId: selectedTenantId,
        planId: plan.planId,
        stepIndex: step.stepIndex,
        capabilityId: step.capabilityId,
        riskLevel: step.riskLevel,
        description: step.description,
        reason: `User requested execution of "${step.capabilityId}" as part of plan: "${plan.intent}"`,
        irreversible: !step.reversible,
      })
      setApprovalIds((prev) => ({ ...prev, [step.stepIndex]: result.id }))
      setPendingStep(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approval request failed')
    } finally {
      setApprovalBusy(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
    setDocResult(null)
    setDocError('')
  }

  async function handleAnalyzeFile() {
    if (!selectedFile || !selectedTenantId) return
    setAnalyzing(true)
    setDocError('')
    setDocResult(null)
    try {
      const base64 = await fileToBase64(selectedFile)
      const result = await analyzeSelectedDocument(
        selectedTenantId,
        selectedFile.name,
        selectedFile.type || 'application/octet-stream',
        base64,
        selectedFile.size
      )
      setDocResult(result)
    } catch (e) {
      setDocError(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="p-6 max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Computer Control</h1>
          <p className="text-sm text-gray-400 mt-1">
            Safe, permissioned, approval-gated computer assistance. All actions are visible, auditable, and require explicit approval.
          </p>
        </div>

        {error && <div className="p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">{error}</div>}

        {/* Tenant selector */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-wrap items-center gap-3">
          <label className="text-sm text-gray-400">Tenant:</label>
          <select
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
            className="border border-white/20 rounded-lg px-3 py-1.5 text-sm bg-white/10 text-white"
          >
            <option value="">Select a tenant...</option>
            {tenants.map((t) => (
              <option key={t.tenantId} value={t.tenantId}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Action Intent Input */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="font-semibold text-white mb-1">Action Intent</h2>
          <p className="text-xs text-gray-500 mb-3">
            Describe what you want ARIA to help you do. A proposed plan will be created — it will NOT auto-execute.
          </p>
          <div className="flex gap-3">
            <input
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handlePlan() }}
              placeholder="e.g. Open the vaccination report and prepare a summary"
              className="flex-1 rounded-lg px-3 py-2 text-sm bg-white/10 border border-white/20 text-white placeholder-gray-500"
              disabled={!selectedTenantId}
            />
            <button
              onClick={handlePlan}
              disabled={planBusy || !intent.trim() || !selectedTenantId}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50 whitespace-nowrap"
            >
              {planBusy ? 'Planning...' : 'Create Plan'}
            </button>
          </div>
          {planError && <p className="text-xs text-red-400 mt-2">{planError}</p>}
        </div>

        {/* Action Plan Preview */}
        {plan && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-white">Action Plan Preview</h2>
              <span className={`text-xs px-2 py-0.5 rounded border font-medium ${RISK_COLORS[plan.overallRiskLevel] ?? RISK_COLORS.low}`}>
                {plan.overallRiskLevel} risk
              </span>
            </div>

            {planSummary && (
              <div className="mb-3 p-3 rounded-lg bg-blue-900/20 border border-blue-700/30 text-xs text-blue-200">
                {planSummary.summary}
              </div>
            )}

            <p className="text-xs text-gray-500 mb-3">
              Intent: <span className="text-gray-300 italic">"{plan.intent}"</span>
              {plan.requiresApproval && (
                <span className="ml-2 px-1.5 py-0.5 rounded bg-yellow-900/40 text-yellow-300 border border-yellow-700/40">
                  Approval required
                </span>
              )}
            </p>

            <div className="space-y-2">
              {plan.steps.map((step) => (
                <div
                  key={step.stepIndex}
                  className={`p-3 rounded-lg border ${RISK_COLORS[step.riskLevel] ?? RISK_COLORS.low}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono text-gray-500 flex-shrink-0">#{step.stepIndex + 1}</span>
                      <span className="text-sm text-white truncate">{step.description}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-mono opacity-70">{step.capabilityId}</span>
                      {step.requiresApproval && !approvalIds[step.stepIndex] && (
                        <button
                          onClick={() => { setPendingStep(step); void handleRequestApproval(step) }}
                          disabled={approvalBusy}
                          className="text-xs px-2 py-0.5 rounded bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50"
                        >
                          Request Approval
                        </button>
                      )}
                      {approvalIds[step.stepIndex] && (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-900/40 text-green-300 border border-green-700/40">
                          Approval sent
                        </span>
                      )}
                      {!step.requiresApproval && (
                        <span className="text-xs text-gray-500">No approval needed</span>
                      )}
                    </div>
                  </div>
                  {!step.reversible && (
                    <p className="text-xs text-orange-400 mt-1">⚠ Irreversible action</p>
                  )}
                </div>
              ))}
            </div>

            {Object.keys(approvalIds).length > 0 && (
              <div className="mt-3 p-2 rounded bg-purple-900/20 border border-purple-700/30 text-xs text-purple-300">
                Approval requests sent:{' '}
                {Object.entries(approvalIds).map(([i, id]) => (
                  <span key={i} className="ml-2 font-mono">Step {+i + 1}: {id.slice(0, 10)}…</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* File Picker Card */}
        {selectedTenantId && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-1">Analyze a File with ARIA</h2>
            <p className="text-xs text-gray-500 mb-3">
              Select a file using the browser file picker — you are always in control. ARIA reads only the file you choose.
              No silent file access. File content is analyzed by ARIA and not stored.
            </p>

            {/* Flow description */}
            <div className="mb-4 space-y-1">
              {[
                'You choose a file using your browser\'s file picker',
                'ARIA analyzes the file content (sent securely to Cloud Function)',
                'Summary and action items are extracted',
                'Suggested tasks/reminders are shown — nothing is created automatically',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                  <span className="text-blue-400 font-mono flex-shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="*/*"
                onChange={handleFileChange}
                className="hidden"
                id="aria-file-picker"
              />
              <label
                htmlFor="aria-file-picker"
                className="cursor-pointer px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-sm text-white"
              >
                Choose File
              </label>
              {selectedFile && (
                <span className="text-sm text-gray-300">
                  {selectedFile.name} <span className="text-gray-500">({Math.round(selectedFile.size / 1024)} KB)</span>
                </span>
              )}
              {selectedFile && (
                <button
                  onClick={handleAnalyzeFile}
                  disabled={analyzing || !selectedTenantId}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm disabled:opacity-50"
                >
                  {analyzing ? 'Analyzing...' : 'Analyze with ARIA'}
                </button>
              )}
            </div>
            {docError && <p className="text-xs text-red-400 mt-2">{docError}</p>}
          </div>
        )}

        {/* Document Analysis Card */}
        {docResult && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
            <h2 className="font-semibold text-white">Document Analysis</h2>

            {/* Summary */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-1">Summary</h3>
              <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-700/30 text-sm text-blue-100">
                {docResult.summary}
              </div>
            </div>

            {/* Action Items */}
            {docResult.actionItems.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">Extracted Action Items ({docResult.actionItems.length})</h3>
                <div className="space-y-1.5">
                  {docResult.actionItems.map((item) => (
                    <div
                      key={item.index}
                      className={`p-2 rounded border text-xs ${RISK_COLORS[item.priority === 'high' ? 'high' : item.priority === 'medium' ? 'medium' : 'low']}`}
                    >
                      <span className="font-medium">{item.text}</span>
                      {item.suggestedDueDate && (
                        <span className="ml-2 text-gray-400">Due: {item.suggestedDueDate}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Actions */}
            {(docResult.suggestedTasks.length > 0 || docResult.suggestedReminders.length > 0) && (
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">Suggested Actions</h3>
                <div className="p-2 rounded bg-yellow-900/20 border border-yellow-700/30 text-xs text-yellow-300 mb-2">
                  These are suggestions only — nothing will be created without your explicit approval.
                </div>
                <div className="space-y-2">
                  {docResult.suggestedTasks.map((suggestion, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10">
                      <div className="min-w-0">
                        <span className="text-xs text-blue-400 font-medium">Task Suggestion: </span>
                        <span className="text-xs text-white">{suggestion.title}</span>
                      </div>
                      <button className="text-xs px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0">
                        Create Task
                      </button>
                    </div>
                  ))}
                  {docResult.suggestedReminders.map((suggestion, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10">
                      <div className="min-w-0">
                        <span className="text-xs text-purple-400 font-medium">Reminder Suggestion: </span>
                        <span className="text-xs text-white">{suggestion.title}</span>
                      </div>
                      <button className="text-xs px-3 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0">
                        Create Reminder
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!docResult.aiGatewayUsed && (
              <p className="text-xs text-gray-600">
                Full AI summary requires AI Gateway integration (Phase 5.7). Structural analysis shown above.
              </p>
            )}
          </div>
        )}

        {/* Live Audit Feed */}
        {selectedTenantId && (
          <LiveComputerAuditFeed tenantId={selectedTenantId} pollIntervalMs={15000} limit={15} />
        )}

        {/* Full Dashboard (existing Phase 5.5 UI) */}
        <div className="border-t border-white/10 pt-6">
          <h2 className="text-lg font-semibold text-white mb-4">Capability & Agent Management</h2>
          <ComputerControlDashboard />
        </div>

      </div>
    </div>
  )
}
