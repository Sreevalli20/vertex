/**
 * VERITYX AI — Brand Integrity & Content Governance Platform
 * Core Domain Models and Type Definitions
 */

export type SeverityLevel = 'fail' | 'warning' | 'info';

export type ResultCategory = 'pass' | 'warning' | 'fail' | 'not_checked';

export type EvidenceStatus =
  | 'verified_in_documents'
  | 'unverified_missing_evidence'
  | 'rule_violation'
  | 'not_applicable';

export type ReviewStatus =
  | 'draft'
  | 'analyzed'
  | 'changes_required'
  | 'ready_for_review'
  | 'approved'
  | 'rejected';

export type RuleType =
  | 'exact_phrase_required'
  | 'prohibited_phrase'
  | 'required_disclaimer'
  | 'approved_terminology'
  | 'numerical_claim_requires_reference'
  | 'absolute_language'
  | 'regex_pattern'
  | 'repeated_phrase_check';

export type RuleCategory =
  | 'brand_consistency'
  | 'content_integrity'
  | 'governance'
  | 'legal_compliance'
  | 'performance_claims';

export interface GovernanceRule {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  severity: SeverityLevel;
  ruleType: RuleType;
  /** Primary search pattern, target phrase, or regex string */
  pattern: string;
  /** Suggested replacement or canonical approved term, if applicable */
  replacement?: string;
  /** Explanatory guidance shown to the author */
  explanation: string;
  enabled: boolean;
  isBuiltIn?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandProfile {
  id: string;
  name: string;
  description: string;
  tagline?: string;
  approvedProductNames: string[];
  approvedTerminology: Array<{ original: string; canonical: string; context?: string }>;
  prohibitedTerminology: Array<{ term: string; reason: string; suggestedAlternative?: string }>;
  requiredDisclaimers: Array<{ id: string; name: string; text: string; appliesTo?: string }>;
  toneGuidelines: string[];
  customRules: GovernanceRule[];
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: 'product_specs' | 'pricing_terms' | 'certifications' | 'benchmarks' | 'legal_disclaimers' | 'brand_voice' | 'general';
  filename?: string;
  fileType: 'txt' | 'md' | 'csv' | 'json' | 'manual';
  content: string;
  summary?: string;
  characterCount: number;
  wordCount: number;
  parsedFactsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Finding {
  id: string;
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  severity: SeverityLevel;
  description: string;
  /** Matched substring or claim */
  relevantText: string;
  startIndex?: number;
  endIndex?: number;
  /** Supporting quote from knowledge base if verified, or explanation */
  supportingEvidence?: {
    documentId: string;
    documentTitle: string;
    matchedSnippet: string;
    confidenceScore: number; // 0 to 1 based on token match
  };
  evidenceStatus: EvidenceStatus;
  suggestedCorrection?: string;
  explanation: string;
}

export interface VerificationRun {
  id: string;
  contentTitle: string;
  category: string;
  rawContent: string;
  version: number;
  brandProfileId: string;
  brandProfileName: string;
  enabledRuleIds: string[];
  findings: Finding[];
  overallResult: ResultCategory;
  metrics: {
    characterCount: number;
    wordCount: number;
    failCount: number;
    warningCount: number;
    infoCount: number;
    claimsIdentified: number;
    claimsGrounded: number;
    unverifiedClaims: number;
    rulesEvaluatedCount: number;
  };
  reviewStatus: ReviewStatus;
  humanReviewDecision?: {
    decision: 'approved' | 'rejected' | 'overridden_and_approved';
    timestamp: string;
    reviewerLabel: string;
    notes?: string;
    overrideReason?: string;
    unresolvedBlockingFindingsOverridden?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  eventType:
    | 'brand_profile_created'
    | 'brand_profile_updated'
    | 'brand_profile_deleted'
    | 'governance_rule_created'
    | 'governance_rule_updated'
    | 'governance_rule_deleted'
    | 'governance_rule_toggled'
    | 'knowledge_document_added'
    | 'knowledge_document_updated'
    | 'knowledge_document_deleted'
    | 'verification_run_executed'
    | 'review_status_changed'
    | 'review_approved'
    | 'review_rejected'
    | 'review_override_recorded'
    | 'review_deleted'
    | 'data_exported'
    | 'data_imported'
    | 'database_cleared'
    | 'sample_data_loaded';
  recordId: string;
  recordTitle: string;
  details: Record<string, unknown>;
  actorLabel: string;
}

export interface ExportDataPackage {
  schemaVersion: string;
  exportedAt: string;
  platform: string;
  brands: BrandProfile[];
  rules: GovernanceRule[];
  documents: KnowledgeDocument[];
  reviews: VerificationRun[];
  auditEvents: AuditEvent[];
}
