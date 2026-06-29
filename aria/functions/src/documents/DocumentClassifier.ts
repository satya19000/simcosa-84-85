import Anthropic from '@anthropic-ai/sdk'
import type { DocumentCategory, DocumentFormat } from './DocumentTypes'

const CATEGORY_KEYWORDS: Record<DocumentCategory, string[]> = {
  medical: ['patient', 'diagnosis', 'prescription', 'medicine', 'doctor', 'hospital', 'treatment', 'disease', 'health'],
  government: ['circular', 'notification', 'order', 'ministry', 'department', 'gazette', 'act', 'regulation', 'official'],
  finance: ['invoice', 'payment', 'bank', 'account', 'balance', 'tax', 'budget', 'expense', 'revenue', 'profit'],
  legal: ['agreement', 'contract', 'clause', 'jurisdiction', 'court', 'plaintiff', 'defendant', 'legal', 'law'],
  personal: ['diary', 'note', 'personal', 'private', 'family', 'letter'],
  education: ['syllabus', 'marks', 'grade', 'exam', 'school', 'college', 'university', 'student', 'teacher'],
  research: ['abstract', 'methodology', 'hypothesis', 'conclusion', 'references', 'study', 'analysis', 'data'],
  public_health: ['malaria', 'vaccination', 'immunization', 'epidemic', 'outbreak', 'public health', 'surveillance'],
  meeting_notes: ['agenda', 'minutes', 'attendees', 'action items', 'decision', 'discussion', 'meeting'],
  project: ['project', 'milestone', 'deliverable', 'timeline', 'stakeholder', 'sprint', 'roadmap'],
  invoice: ['invoice', 'bill', 'total', 'gst', 'tax', 'amount due', 'payment terms'],
  receipt: ['receipt', 'paid', 'transaction', 'amount paid', 'cash', 'upi'],
  custom: [],
}

export class DocumentClassifier {
  constructor(private readonly apiKey: string) {}

  /**
   * Classify by keyword heuristics first, AI if ambiguous.
   */
  async classify(text: string, mimeType: string, filename: string): Promise<DocumentCategory> {
    // Quick heuristic
    const heuristic = this.heuristicClassify(text, filename)
    if (heuristic) return heuristic

    // AI fallback
    return this.aiClassify(text, filename)
  }

  private heuristicClassify(text: string, filename: string): DocumentCategory | null {
    const lower = (text + ' ' + filename).toLowerCase()
    let bestCategory: DocumentCategory | null = null
    let bestScore = 0

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [DocumentCategory, string[]][]) {
      if (keywords.length === 0) continue
      const score = keywords.filter((kw) => lower.includes(kw)).length
      if (score > bestScore) {
        bestScore = score
        bestCategory = category
      }
    }

    return bestScore >= 2 ? bestCategory : null
  }

  private async aiClassify(text: string, filename: string): Promise<DocumentCategory> {
    try {
      const client = new Anthropic({ apiKey: this.apiKey })
      const categories = Object.keys(CATEGORY_KEYWORDS).join(', ')
      const response = await client.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: `Classify this document into exactly one category: ${categories}

Filename: ${filename}
Text (first 500 chars): ${text.slice(0, 500)}

Return ONLY the category name, nothing else.`,
          },
        ],
      })
      const textBlock = response.content.find((b) => b.type === 'text')
      const raw = (textBlock?.type === 'text' ? textBlock.text.trim().toLowerCase() : '') as DocumentCategory
      return (CATEGORY_KEYWORDS[raw] !== undefined ? raw : 'custom') as DocumentCategory
    } catch {
      return 'custom'
    }
  }

  inferFormat(mimeType: string, filename: string): DocumentFormat {
    const ext = filename.split('.').pop()?.toLowerCase() ?? ''
    const mime = mimeType.toLowerCase()

    if (mime.includes('pdf') || ext === 'pdf') return 'pdf'
    if (mime.includes('docx') || ext === 'docx') return 'docx'
    if (mime.includes('xlsx') || ext === 'xlsx') return 'xlsx'
    if (mime.includes('pptx') || ext === 'pptx') return 'pptx'
    if (mime.includes('csv') || ext === 'csv') return 'csv'
    if (mime.includes('rtf') || ext === 'rtf') return 'rtf'
    if (mime.includes('markdown') || ext === 'md') return 'md'
    if (mime.includes('text') || ext === 'txt') return 'txt'
    if (mime.includes('image')) {
      if (filename.toLowerCase().includes('scan')) return 'scanned_image'
      if (filename.toLowerCase().includes('screenshot')) return 'screenshot'
      return 'image'
    }
    return 'custom'
  }
}
