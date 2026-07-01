/**
 * MeetingExportManager.ts — export interface definitions for meeting minutes.
 *
 * ARCHITECTURE NOTE: This is a placeholder architecture only.
 * Clean interfaces are defined for future export provider implementations.
 * No heavy export engine is implemented here.
 *
 * Supported formats (future): DOCX, PDF, Markdown, plain text.
 */

import type { ExportFormat } from './MeetingTypes'
import type { MeetingNotes } from './MeetingNotesManager'

export interface ExportResult {
  format: ExportFormat
  content: string        // Markdown/plain text (real); base64 for binary (future)
  mimeType: string
  fileName: string
  notImplemented?: boolean
}

/**
 * Interface for future export providers.
 * Each provider handles one format.
 */
export interface MeetingExportProvider {
  readonly format: ExportFormat
  export(notes: MeetingNotes): Promise<ExportResult>
}

/**
 * Markdown export provider — real implementation.
 */
export class MarkdownExportProvider implements MeetingExportProvider {
  readonly format: ExportFormat = 'markdown'

  async export(notes: MeetingNotes): Promise<ExportResult> {
    // Import here to avoid circular dependency
    const { MeetingNotesManager } = await import('./MeetingNotesManager')
    const manager = new MeetingNotesManager(null as never)
    const content = manager.toMarkdown(notes)
    return {
      format: 'markdown',
      content,
      mimeType: 'text/markdown',
      fileName: `meeting-${notes.sessionId}.md`,
    }
  }
}

/**
 * Plain text export provider — real implementation.
 */
export class PlainTextExportProvider implements MeetingExportProvider {
  readonly format: ExportFormat = 'plaintext'

  async export(notes: MeetingNotes): Promise<ExportResult> {
    const { MeetingNotesManager } = await import('./MeetingNotesManager')
    const manager = new MeetingNotesManager(null as never)
    const content = manager.toPlainText(notes)
    return {
      format: 'plaintext',
      content,
      mimeType: 'text/plain',
      fileName: `meeting-${notes.sessionId}.txt`,
    }
  }
}

/**
 * DOCX export provider — placeholder (requires third-party library).
 */
export class DocxExportProvider implements MeetingExportProvider {
  readonly format: ExportFormat = 'docx'

  async export(_notes: MeetingNotes): Promise<ExportResult> {
    return {
      format: 'docx',
      content: '',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileName: `meeting-${_notes.sessionId}.docx`,
      notImplemented: true,
    }
  }
}

/**
 * PDF export provider — placeholder (requires Puppeteer or similar).
 */
export class PdfExportProvider implements MeetingExportProvider {
  readonly format: ExportFormat = 'pdf'

  async export(_notes: MeetingNotes): Promise<ExportResult> {
    return {
      format: 'pdf',
      content: '',
      mimeType: 'application/pdf',
      fileName: `meeting-${_notes.sessionId}.pdf`,
      notImplemented: true,
    }
  }
}

/**
 * MeetingExportManager — registry of export providers.
 */
export class MeetingExportManager {
  private readonly providers = new Map<ExportFormat, MeetingExportProvider>([
    ['markdown', new MarkdownExportProvider()],
    ['plaintext', new PlainTextExportProvider()],
    ['docx', new DocxExportProvider()],
    ['pdf', new PdfExportProvider()],
  ])

  async exportNotes(notes: MeetingNotes, format: ExportFormat): Promise<ExportResult> {
    const provider = this.providers.get(format)
    if (!provider) {
      throw new Error(`Unsupported export format: ${format}`)
    }
    return provider.export(notes)
  }

  supportedFormats(): ExportFormat[] {
    return Array.from(this.providers.keys())
  }
}
