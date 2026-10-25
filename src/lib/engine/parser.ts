/**
 * Local Document & File Parser
 * Safely parses and validates TXT, Markdown, CSV, and JSON files without network calls.
 */

export interface ParsedDocumentResult {
  title: string;
  fileType: 'txt' | 'md' | 'csv' | 'json';
  content: string;
  characterCount: number;
  wordCount: number;
  parsedFactsCount: number;
  summary: string;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB limit for local responsive processing

export class DocumentParser {
  /**
   * Validate file size and extension
   */
  public static validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 5 MB local verification threshold.`,
      };
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    const allowed = ['txt', 'md', 'markdown', 'csv', 'json'];
    if (!extension || !allowed.includes(extension)) {
      return {
        valid: false,
        error: `Unsupported file type ".${extension || 'unknown'}". Supported formats are .txt, .md, .csv, and .json.`,
      };
    }

    return { valid: true };
  }

  /**
   * Parse a File object into standardized document representation
   */
  public static async parseFile(file: File): Promise<ParsedDocumentResult> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const rawText = await file.text();
    const extension = file.name.split('.').pop()?.toLowerCase();

    const title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    switch (extension) {
      case 'json':
        return this.parseJSON(title, rawText);
      case 'csv':
        return this.parseCSV(title, rawText);
      case 'md':
      case 'markdown':
        return this.parseMarkdown(title, rawText);
      case 'txt':
      default:
        return this.parsePlainText(title, rawText);
    }
  }

  public static parsePlainText(title: string, rawText: string): ParsedDocumentResult {
    const cleanText = rawText.trim();
    if (!cleanText) {
      throw new Error('The uploaded document is empty.');
    }

    const words = cleanText.split(/\s+/).filter(Boolean);
    const sentences = cleanText.split(/[.!?]+/).filter((s) => s.trim().length > 5);

    return {
      title,
      fileType: 'txt',
      content: cleanText,
      characterCount: cleanText.length,
      wordCount: words.length,
      parsedFactsCount: sentences.length,
      summary: cleanText.slice(0, 200) + (cleanText.length > 200 ? '...' : ''),
    };
  }

  public static parseMarkdown(title: string, rawText: string): ParsedDocumentResult {
    const cleanText = rawText.trim();
    if (!cleanText) {
      throw new Error('The uploaded markdown file is empty.');
    }

    // Strip header markers and links to raw readable format while preserving text
    const normalized = cleanText
      .replace(/#+\s+/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_~`]/g, '');

    const words = normalized.split(/\s+/).filter(Boolean);
    const facts = normalized.split(/\n+/).filter((line) => line.trim().length > 5);

    return {
      title,
      fileType: 'md',
      content: cleanText,
      characterCount: cleanText.length,
      wordCount: words.length,
      parsedFactsCount: facts.length,
      summary: normalized.slice(0, 200) + (normalized.length > 200 ? '...' : ''),
    };
  }

  public static parseCSV(title: string, rawText: string): ParsedDocumentResult {
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      throw new Error('CSV file has no readable rows.');
    }

    // Extract headers
    const headerLine = lines[0];
    const headers = headerLine.split(',').map((h) => h.replace(/^"|"$/g, '').trim());

    const rowFacts: string[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      // Basic CSV field parser handling simple quotes
      const cells = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
      const factLine = cells
        .map((val, idx) => (headers[idx] ? `${headers[idx]}: ${val}` : val))
        .join(' | ');
      if (factLine.length > 3) {
        rowFacts.push(factLine);
      }
    }

    const compiledContent = `Data Source: ${title}\n` + rowFacts.join('\n');
    const words = compiledContent.split(/\s+/).filter(Boolean);

    return {
      title,
      fileType: 'csv',
      content: compiledContent,
      characterCount: compiledContent.length,
      wordCount: words.length,
      parsedFactsCount: rowFacts.length,
      summary: `CSV dataset containing ${rowFacts.length} structured records across columns: ${headers.join(', ')}`,
    };
  }

  public static parseJSON(title: string, rawText: string): ParsedDocumentResult {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      throw new Error(`Malformed JSON file: ${e instanceof Error ? e.message : 'Syntax error'}`);
    }

    const facts: string[] = [];

    const extractStrings = (obj: unknown, prefix = '') => {
      if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
        facts.push(`${prefix ? `${prefix}: ` : ''}${obj}`);
      } else if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          extractStrings(item, `${prefix}[${index}]`);
        });
      } else if (obj !== null && typeof obj === 'object') {
        for (const [key, val] of Object.entries(obj)) {
          const nextPrefix = prefix ? `${prefix}.${key}` : key;
          extractStrings(val, nextPrefix);
        }
      }
    };

    extractStrings(parsed);

    const compiledContent = facts.join('\n');
    const words = compiledContent.split(/\s+/).filter(Boolean);

    return {
      title,
      fileType: 'json',
      content: compiledContent,
      characterCount: compiledContent.length,
      wordCount: words.length,
      parsedFactsCount: facts.length,
      summary: `Structured JSON containing ${facts.length} verified key-value elements.`,
    };
  }
}
