/**
 * Deterministic Content Verification & Governance Engine
 * Performs 100% client-side rule evaluation, claim extraction,
 * and knowledge-grounded evidence matching.
 */

import {
  BrandProfile,
  GovernanceRule,
  KnowledgeDocument,
  Finding,
  VerificationRun,
  ResultCategory,
  SeverityLevel,
} from '../../types';

export interface VerificationInput {
  contentTitle: string;
  category: string;
  rawContent: string;
  brandProfile: BrandProfile | null;
  governanceRules: GovernanceRule[];
  knowledgeDocuments: KnowledgeDocument[];
  version?: number;
}

export class VerificationEngine {
  /**
   * Run full verification review on provided content
   */
  public static verify(input: VerificationInput): VerificationRun {
    const {
      contentTitle,
      category,
      rawContent,
      brandProfile,
      governanceRules,
      knowledgeDocuments,
      version = 1,
    } = input;

    const findings: Finding[] = [];
    let findingCounter = 1;

    const createFindingId = () => `VF-${Date.now().toString().slice(-4)}-${String(findingCounter++).padStart(3, '0')}`;

    const content = rawContent.trim();
    if (!content) {
      return {
        id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        contentTitle: contentTitle.trim() || 'Untitled Content Draft',
        category: category || 'General Marketing',
        rawContent,
        version,
        brandProfileId: brandProfile?.id || 'none',
        brandProfileName: brandProfile?.name || 'Default Governance Profile',
        enabledRuleIds: governanceRules.filter((r) => r.enabled).map((r) => r.id),
        findings: [],
        overallResult: 'not_checked',
        metrics: {
          characterCount: 0,
          wordCount: 0,
          failCount: 0,
          warningCount: 0,
          infoCount: 0,
          claimsIdentified: 0,
          claimsGrounded: 0,
          unverifiedClaims: 0,
          rulesEvaluatedCount: governanceRules.filter((r) => r.enabled).length,
        },
        reviewStatus: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const words = content.split(/\s+/).filter(Boolean);
    const characters = content.length;

    // Enabled active rules
    const activeRules = governanceRules.filter((r) => r.enabled);
    let rulesEvaluatedCount = activeRules.length;

    if (brandProfile) {
      rulesEvaluatedCount += (brandProfile.customRules?.length || 0) +
        (brandProfile.prohibitedTerminology?.length || 0) +
        (brandProfile.approvedTerminology?.length || 0) +
        (brandProfile.requiredDisclaimers?.length || 0);
    }

    let claimsIdentified = 0;
    let claimsGrounded = 0;
    let unverifiedClaims = 0;

    // -------------------------------------------------------------
    // 1. Brand Profile Checks: Prohibited Terminology
    // -------------------------------------------------------------
    if (brandProfile && Array.isArray(brandProfile.prohibitedTerminology)) {
      for (const item of brandProfile.prohibitedTerminology) {
        if (!item.term) continue;
        const escaped = this.escapeRegExp(item.term.trim());
        const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
        let match: RegExpExecArray | null;

        while ((match = regex.exec(content)) !== null) {
          findings.push({
            id: createFindingId(),
            ruleId: `brand-prohibit-${item.term.toLowerCase().replace(/\s+/g, '-')}`,
            ruleName: `Brand Prohibited Term: "${item.term}"`,
            category: 'brand_consistency',
            severity: 'fail',
            description: `Use of brand-prohibited term "${match[0]}". Reason: ${item.reason || 'Restricted by brand profile.'}`,
            relevantText: match[0],
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            evidenceStatus: 'rule_violation',
            suggestedCorrection: item.suggestedAlternative || undefined,
            explanation: `Brand guidelines strictly prohibit "${item.term}". ${item.reason || ''}`,
          });
        }
      }
    }

    // -------------------------------------------------------------
    // 2. Brand Profile Checks: Approved Terminology (Enforce Canonical)
    // -------------------------------------------------------------
    if (brandProfile && Array.isArray(brandProfile.approvedTerminology)) {
      for (const item of brandProfile.approvedTerminology) {
        if (!item.original || !item.canonical) continue;
        // Skip if original equals canonical
        if (item.original.trim().toLowerCase() === item.canonical.trim().toLowerCase()) continue;

        const escaped = this.escapeRegExp(item.original.trim());
        const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
        let match: RegExpExecArray | null;

        while ((match = regex.exec(content)) !== null) {
          findings.push({
            id: createFindingId(),
            ruleId: `brand-canonical-${item.original.toLowerCase().replace(/\s+/g, '-')}`,
            ruleName: `Non-Canonical Terminology: "${item.original}"`,
            category: 'brand_consistency',
            severity: 'warning',
            description: `Found deprecated or non-canonical term "${match[0]}". Approved standard is "${item.canonical}".`,
            relevantText: match[0],
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            evidenceStatus: 'rule_violation',
            suggestedCorrection: item.canonical,
            explanation: item.context || `Replace with approved canonical wording: "${item.canonical}".`,
          });
        }
      }
    }

    // -------------------------------------------------------------
    // 3. Brand Profile Checks: Required Disclaimers
    // -------------------------------------------------------------
    if (brandProfile && Array.isArray(brandProfile.requiredDisclaimers)) {
      for (const disc of brandProfile.requiredDisclaimers) {
        if (!disc.text) continue;
        const hasDisclaimer = this.checkFuzzyOrExactMatch(content, disc.text, 0.85);

        if (!hasDisclaimer) {
          findings.push({
            id: createFindingId(),
            ruleId: `brand-disc-${disc.id || Math.random().toString(36).substring(2, 6)}`,
            ruleName: `Missing Required Disclaimer: "${disc.name}"`,
            category: 'legal_compliance',
            severity: 'fail',
            description: `Content is missing mandatory brand disclaimer: "${disc.name}".`,
            relevantText: disc.text.slice(0, 80) + '...',
            evidenceStatus: 'rule_violation',
            suggestedCorrection: `Include mandatory disclosure: "${disc.text}"`,
            explanation: `Brand profile requires inclusion of this disclaimer for publication: "${disc.text}".`,
          });
        }
      }
    }

    // -------------------------------------------------------------
    // 4. Governance Rules Evaluation
    // -------------------------------------------------------------
    for (const rule of activeRules) {
      try {
        switch (rule.ruleType) {
          case 'exact_phrase_required': {
            if (rule.pattern && !this.checkFuzzyOrExactMatch(content, rule.pattern, 0.9)) {
              findings.push({
                id: createFindingId(),
                ruleId: rule.id,
                ruleName: rule.name,
                category: rule.category,
                severity: rule.severity,
                description: `Mandatory phrase not found in content: "${rule.pattern}"`,
                relevantText: rule.pattern,
                evidenceStatus: 'rule_violation',
                suggestedCorrection: rule.replacement || rule.pattern,
                explanation: rule.explanation || 'This required phrase must appear in approved publication assets.',
              });
            }
            break;
          }

          case 'required_disclaimer': {
            if (rule.pattern) {
              const isPerfDisc = rule.id === 'rule-disc-01' || rule.name.toLowerCase().includes('performance') || rule.name.toLowerCase().includes('benchmark');
              const hasNumericOrPerfClaim = /(\b\d+(?:\.\d+)?%|\b\d+x|\b\d+\s*ms\b)/i.test(content);
              if (isPerfDisc && !hasNumericOrPerfClaim) {
                break;
              }

              const hasDisc = this.checkFuzzyOrExactMatch(content, rule.pattern, 0.85);
              if (!hasDisc) {
                findings.push({
                  id: createFindingId(),
                  ruleId: rule.id,
                  ruleName: rule.name,
                  category: rule.category,
                  severity: rule.severity,
                  description: `Missing mandatory disclosure: "${rule.name}"`,
                  relevantText: rule.pattern,
                  evidenceStatus: 'rule_violation',
                  suggestedCorrection: `Add disclosure text: "${rule.pattern}"`,
                  explanation: rule.explanation,
                });
              }
            }
            break;
          }

          case 'prohibited_phrase':
          case 'absolute_language':
          case 'regex_pattern': {
            if (!rule.pattern) break;
            const regex = this.compileSafeRegex(rule.pattern);
            if (!regex) break;

            let match: RegExpExecArray | null;
            // Prevent runaway loops
            let loopSafety = 0;
            while ((match = regex.exec(content)) !== null && loopSafety++ < 100) {
              findings.push({
                id: createFindingId(),
                ruleId: rule.id,
                ruleName: rule.name,
                category: rule.category,
                severity: rule.severity,
                description: `Triggered rule "${rule.name}": Detected "${match[0]}"`,
                relevantText: match[0],
                startIndex: match.index,
                endIndex: match.index + match[0].length,
                evidenceStatus: 'rule_violation',
                suggestedCorrection: rule.replacement || undefined,
                explanation: rule.explanation,
              });

              if (!regex.global) break;
            }
            break;
          }

          case 'repeated_phrase_check': {
            // Detect sentences or 6+ word segments repeated verbatim
            const repeatedSnippets = this.detectRepeatedPhrases(content);
            for (const item of repeatedSnippets) {
              findings.push({
                id: createFindingId(),
                ruleId: rule.id,
                ruleName: rule.name,
                category: rule.category,
                severity: rule.severity,
                description: `Detected repetitive text segment repeated ${item.count} times.`,
                relevantText: item.text,
                startIndex: item.startIndex,
                endIndex: item.endIndex,
                evidenceStatus: 'rule_violation',
                suggestedCorrection: 'Remove or consolidate duplicate copy.',
                explanation: rule.explanation || 'Duplicate phrases degrade editorial polish and can confuse readers.',
              });
            }
            break;
          }

          case 'numerical_claim_requires_reference': {
            // Quantitative claim grounding check
            const patternToUse = rule.pattern || '(\\b\\d+(?:\\.\\d+)?%|\\b\\d+x|\\$\\d+(?:[.,]\\d+)?(?:\\s*(?:million|billion|k|M|B))?|\\b\\d+(?:\\.\\d+)?\\s*(?:milliseconds?|ms|seconds?|percent|times|Gbps|Tbps))(?![\\w%])';
            const numRegex = this.compileSafeRegex(patternToUse);
            if (!numRegex) break;

            let numMatch: RegExpExecArray | null;
            let matchSafety = 0;
            const seenNumbers = new Set<string>();

            while ((numMatch = numRegex.exec(content)) !== null && matchSafety++ < 80) {
              const matchedStr = numMatch[0].trim();
              if (seenNumbers.has(matchedStr.toLowerCase())) {
                if (!numRegex.global) break;
                continue;
              }
              seenNumbers.add(matchedStr.toLowerCase());

              claimsIdentified++;

              // Extract sentence containing the claim for better context
              const surroundingSentence = this.extractSentenceAround(content, numMatch.index, numMatch.index + matchedStr.length);

              // Search knowledge base documents for evidence grounding
              const evidence = this.findEvidenceInKnowledgeBase(matchedStr, surroundingSentence, knowledgeDocuments);

              if (evidence) {
                claimsGrounded++;
                // Grounded claim - recorded as verified evidence finding (info/pass status)
                findings.push({
                  id: createFindingId(),
                  ruleId: rule.id,
                  ruleName: `Verified Quantitative Claim: "${matchedStr}"`,
                  category: 'performance_claims',
                  severity: 'info',
                  description: `Quantitative claim "${matchedStr}" is grounded in approved document "${evidence.documentTitle}".`,
                  relevantText: surroundingSentence || matchedStr,
                  startIndex: numMatch.index,
                  endIndex: numMatch.index + matchedStr.length,
                  supportingEvidence: evidence,
                  evidenceStatus: 'verified_in_documents',
                  explanation: `Approved source match confirmed (${Math.round(evidence.confidenceScore * 100)}% match confidence) against reference file.`,
                });
              } else {
                unverifiedClaims++;
                findings.push({
                  id: createFindingId(),
                  ruleId: rule.id,
                  ruleName: `Unverified Numerical Claim: "${matchedStr}"`,
                  category: 'performance_claims',
                  severity: rule.severity, // warning
                  description: `Quantitative metric "${matchedStr}" has no matching reference in the approved knowledge base.`,
                  relevantText: surroundingSentence || matchedStr,
                  startIndex: numMatch.index,
                  endIndex: numMatch.index + matchedStr.length,
                  evidenceStatus: 'unverified_missing_evidence',
                  suggestedCorrection: 'Provide approved source documentation or attach benchmark report.',
                  explanation: 'All specific statistics, percentages, speedups, and financial figures require backing evidence in the approved knowledge base before publication.',
                });
              }

              if (!numRegex.global) break;
            }
            break;
          }
        }
      } catch (err) {
        console.warn(`Evaluation error on rule "${rule.name}":`, err);
      }
    }

    // -------------------------------------------------------------
    // 5. Calculate Metrics and Overall Result Category
    // -------------------------------------------------------------
    const failCount = findings.filter((f) => f.severity === 'fail').length;
    const warningCount = findings.filter((f) => f.severity === 'warning').length;
    const infoCount = findings.filter((f) => f.severity === 'info').length;

    let overallResult: ResultCategory = 'pass';
    if (failCount > 0) {
      overallResult = 'fail';
    } else if (warningCount > 0) {
      overallResult = 'warning';
    } else if (content.length === 0) {
      overallResult = 'not_checked';
    }

    return {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      contentTitle: contentTitle.trim() || 'Untitled Content Draft',
      category: category || 'General Marketing',
      rawContent,
      version,
      brandProfileId: brandProfile?.id || 'none',
      brandProfileName: brandProfile?.name || 'Default Governance Profile',
      enabledRuleIds: activeRules.map((r) => r.id),
      findings,
      overallResult,
      metrics: {
        characterCount: characters,
        wordCount: words.length,
        failCount,
        warningCount,
        infoCount,
        claimsIdentified,
        claimsGrounded,
        unverifiedClaims,
        rulesEvaluatedCount,
      },
      reviewStatus: failCount > 0 ? 'changes_required' : warningCount > 0 ? 'ready_for_review' : 'analyzed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // --- Helper: Search Knowledge Base for Supporting Evidence ---
  public static findEvidenceInKnowledgeBase(
    targetNumber: string,
    contextSentence: string,
    docs: KnowledgeDocument[]
  ): Finding['supportingEvidence'] | undefined {
    if (!docs || docs.length === 0) return undefined;

    // Normalize target number (e.g., "$500M", "99.99%", "10x")
    const cleanNum = targetNumber.toLowerCase().replace(/\s+/g, '');

    // Extract significant keywords from the sentence (excluding stop words)
    const stopWords = new Set(['the', 'and', 'with', 'for', 'our', 'that', 'this', 'from', 'have', 'been', 'will', 'your', 'with']);
    const contextWords = contextSentence
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w));

    let bestMatch: Finding['supportingEvidence'] | undefined = undefined;
    let highestScore = 0;

    for (const doc of docs) {
      if (!doc.content) continue;
      const lowerContent = doc.content.toLowerCase();

      // Check if document contains the target number or metric
      const numIndex = lowerContent.indexOf(cleanNum);
      const spaceNumIndex = lowerContent.indexOf(targetNumber.toLowerCase());

      const foundIndex = numIndex !== -1 ? numIndex : spaceNumIndex;

      if (foundIndex !== -1) {
        // Extract a 160-character window around the found number
        const start = Math.max(0, foundIndex - 60);
        const end = Math.min(doc.content.length, foundIndex + 120);
        const snippet = doc.content.slice(start, end).replace(/\s+/g, ' ').trim();

        // Calculate overlap score with surrounding context words
        let wordMatches = 0;
        const lowerSnippet = snippet.toLowerCase();
        for (const word of contextWords) {
          if (lowerSnippet.includes(word)) {
            wordMatches++;
          }
        }

        const score = 0.5 + Math.min(0.5, (wordMatches / Math.max(1, contextWords.length)) * 0.5);

        if (score > highestScore) {
          highestScore = score;
          bestMatch = {
            documentId: doc.id,
            documentTitle: doc.title,
            matchedSnippet: `"...${snippet}..."`,
            confidenceScore: Math.round(score * 100) / 100,
          };
        }
      }
    }

    return bestMatch;
  }

  // --- Helper: Fuzzy/Word Overlap Checker ---
  public static checkFuzzyOrExactMatch(source: string, target: string, threshold = 0.85): boolean {
    const normSource = source.toLowerCase().replace(/\s+/g, ' ').trim();
    const normTarget = target.toLowerCase().replace(/\s+/g, ' ').trim();

    // Exact inclusion
    if (normSource.includes(normTarget)) {
      return true;
    }

    // Word token overlap check
    const targetWords = normTarget.split(/\s+/).filter(Boolean);
    if (targetWords.length === 0) return true;

    let matchedCount = 0;
    for (const word of targetWords) {
      if (normSource.includes(word)) {
        matchedCount++;
      }
    }

    const ratio = matchedCount / targetWords.length;
    return ratio >= threshold;
  }

  // --- Helper: Sentence extractor around an offset ---
  public static extractSentenceAround(text: string, startIndex: number, endIndex: number): string {
    const before = text.slice(0, startIndex);
    const after = text.slice(endIndex);

    const prevSentenceBreak = Math.max(before.lastIndexOf('. '), before.lastIndexOf('\n'), 0);
    let nextSentenceBreak = after.search(/[.\n]/);
    if (nextSentenceBreak === -1) {
      nextSentenceBreak = after.length;
    }

    const sentenceStart = prevSentenceBreak > 0 ? prevSentenceBreak + 2 : 0;
    const sentenceEnd = endIndex + nextSentenceBreak;

    return text.slice(sentenceStart, sentenceEnd).replace(/\s+/g, ' ').trim();
  }

  // --- Helper: Repeated Phrases Detector ---
  public static detectRepeatedPhrases(content: string): Array<{ text: string; count: number; startIndex: number; endIndex: number }> {
    const results: Array<{ text: string; count: number; startIndex: number; endIndex: number }> = [];
    // Split into sentences of at least 25 characters
    const sentences = content
      .split(/[.!?\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 25);

    const counts = new Map<string, number>();
    for (const s of sentences) {
      const key = s.toLowerCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    const recorded = new Set<string>();
    for (const s of sentences) {
      const key = s.toLowerCase();
      const count = counts.get(key) || 0;
      if (count > 1 && !recorded.has(key)) {
        recorded.add(key);
        const idx = content.indexOf(s);
        results.push({
          text: s,
          count,
          startIndex: idx !== -1 ? idx : 0,
          endIndex: idx !== -1 ? idx + s.length : s.length,
        });
      }
    }

    return results;
  }

  // --- Helper: Safe RegExp compiler ---
  public static compileSafeRegex(pattern: string, flags = 'gi'): RegExp | null {
    try {
      return new RegExp(pattern, flags);
    } catch {
      return null;
    }
  }

  // --- Helper: RegExp Escaper ---
  public static escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
