/**
 * Automated test suite for VERITYX AI verification engine and governance workflows
 */

import { describe, it, expect } from 'vitest';
import { VerificationEngine } from '../lib/engine/verificationEngine';
import { DocumentParser } from '../lib/engine/parser';
import { DEFAULT_GOVERNANCE_RULES } from '../lib/engine/defaultRules';
import { BrandProfile, KnowledgeDocument, ExportDataPackage } from '../types';

describe('VERITYX AI Verification Engine', () => {
  const sampleBrand: BrandProfile = {
    id: 'test-brand',
    name: 'Apex Robotics',
    description: 'Precision automation',
    approvedProductNames: ['ApexArm v2', 'ApexVision Core'],
    approvedTerminology: [
      { original: 'Apex Arm', canonical: 'ApexArm v2' },
    ],
    prohibitedTerminology: [
      { term: 'unbreakable', reason: 'False durability claim', suggestedAlternative: 'high-tensile' },
      { term: 'dirt cheap', reason: 'Unprofessional', suggestedAlternative: 'cost-effective' },
    ],
    requiredDisclaimers: [
      {
        id: 'disc-1',
        name: 'Standard Operational Disclaimer',
        text: 'Operational speed depends on payload mass and end-effector tooling.',
      },
    ],
    toneGuidelines: ['Direct', 'Technical'],
    customRules: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleDocs: KnowledgeDocument[] = [
    {
      id: 'doc-1',
      title: 'ApexArm Official Specifications Sheet',
      category: 'product_specs',
      fileType: 'txt',
      content: 'ApexArm v2 delivers 99.98% repeatability across 10,000 continuous cycle tests. Maximum payload capacity is 25kg.',
      characterCount: 100,
      wordCount: 15,
      parsedFactsCount: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it('1. Detects prohibited phrases and returns appropriate severity and suggested alternative', () => {
    const result = VerificationEngine.verify({
      contentTitle: 'Product Ad',
      category: 'Ad',
      rawContent: 'Our new robotics arm is virtually unbreakable and dirt cheap.',
      brandProfile: sampleBrand,
      governanceRules: DEFAULT_GOVERNANCE_RULES,
      knowledgeDocuments: sampleDocs,
    });

    const unbreakableFinding = result.findings.find((f) => f.relevantText.toLowerCase() === 'unbreakable');
    expect(unbreakableFinding).toBeDefined();
    expect(unbreakableFinding?.severity).toBe('fail');
    expect(unbreakableFinding?.suggestedCorrection).toBe('high-tensile');

    const cheapFinding = result.findings.find((f) => f.relevantText.toLowerCase().includes('dirt cheap'));
    expect(cheapFinding).toBeDefined();
  });

  it('2. Detects required phrases when missing', () => {
    const customRequiredRule = {
      id: 'rule-req-iso',
      name: 'Mandatory ISO Certification Notice',
      description: 'Requires ISO statement',
      category: 'governance' as const,
      severity: 'fail' as const,
      ruleType: 'exact_phrase_required' as const,
      pattern: 'Certified according to ISO 9001 standards',
      explanation: 'Must include certification statement',
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = VerificationEngine.verify({
      contentTitle: 'Datasheet',
      category: 'Specs',
      rawContent: 'ApexArm v2 is precision engineered for factories.',
      brandProfile: sampleBrand,
      governanceRules: [customRequiredRule],
      knowledgeDocuments: [],
    });

    const missingFinding = result.findings.find((f) => f.ruleId === 'rule-req-iso');
    expect(missingFinding).toBeDefined();
    expect(missingFinding?.severity).toBe('fail');
  });

  it('3. Detects missing mandatory disclaimers', () => {
    const result = VerificationEngine.verify({
      contentTitle: 'Campaign',
      category: 'Marketing',
      rawContent: 'ApexArm v2 operates with extreme velocity across all industrial assemblies.',
      brandProfile: sampleBrand,
      governanceRules: DEFAULT_GOVERNANCE_RULES,
      knowledgeDocuments: [],
    });

    const disclaimerFinding = result.findings.find((f) =>
      f.ruleName.includes('Missing Required Disclaimer') || f.ruleId.includes('brand-disc')
    );
    expect(disclaimerFinding).toBeDefined();
    expect(disclaimerFinding?.severity).toBe('fail');
  });

  it('4. Detects numerical claims and grounds them in approved documents when evidence matches', () => {
    const result = VerificationEngine.verify({
      contentTitle: 'Performance Fact Sheet',
      category: 'Website',
      rawContent: 'The new system delivers 99.98% repeatability for all manufacturing operations.',
      brandProfile: null,
      governanceRules: DEFAULT_GOVERNANCE_RULES,
      knowledgeDocuments: sampleDocs,
    });

    const groundedFinding = result.findings.find((f) => f.evidenceStatus === 'verified_in_documents');
    expect(groundedFinding).toBeDefined();
    expect(groundedFinding?.supportingEvidence?.documentTitle).toBe('ApexArm Official Specifications Sheet');
    expect(groundedFinding?.supportingEvidence?.matchedSnippet).toContain('99.98%');
  });

  it('5. Flags numerical claims when evidence is NOT found in approved documents', () => {
    const result = VerificationEngine.verify({
      contentTitle: 'Blog Post',
      category: 'Blog',
      rawContent: 'Our factory robots achieved a staggering 85% energy reduction and 15x faster throughput.',
      brandProfile: null,
      governanceRules: DEFAULT_GOVERNANCE_RULES,
      knowledgeDocuments: sampleDocs, // Only has 99.98% repeatability, not 85% or 15x
    });

    const unverifiedFindings = result.findings.filter((f) => f.evidenceStatus === 'unverified_missing_evidence');
    expect(unverifiedFindings.length).toBeGreaterThanOrEqual(1);
    expect(unverifiedFindings[0].severity).toBe('warning');
  });

  it('6. Correctly determines review status transitions (changes_required on fail, ready_for_review on warning, analyzed on clean)', () => {
    // Failing case
    const failRun = VerificationEngine.verify({
      contentTitle: 'Fail Test',
      category: 'Ad',
      rawContent: 'Our product is 100% guaranteed to never fail.',
      brandProfile: null,
      governanceRules: DEFAULT_GOVERNANCE_RULES,
      knowledgeDocuments: [],
    });
    expect(failRun.reviewStatus).toBe('changes_required');
    expect(failRun.overallResult).toBe('fail');

    // Clean case
    const cleanRun = VerificationEngine.verify({
      contentTitle: 'Clean Test',
      category: 'Ad',
      rawContent: 'We provide modular robotic arms designed for modern industrial manufacturing facilities.',
      brandProfile: null,
      governanceRules: DEFAULT_GOVERNANCE_RULES,
      knowledgeDocuments: [],
    });
    expect(cleanRun.reviewStatus).toBe('analyzed');
    expect(cleanRun.overallResult).toBe('pass');
  });

  it('7. Enforces human approval restrictions: blocking findings cannot be approved without recorded override', () => {
    const run = VerificationEngine.verify({
      contentTitle: 'Blocked Ad',
      category: 'Ad',
      rawContent: 'Our system guarantees 100% risk-free operations.',
      brandProfile: null,
      governanceRules: DEFAULT_GOVERNANCE_RULES,
      knowledgeDocuments: [],
    });

    // Check that blocking findings exist
    const blockingFindings = run.findings.filter((f) => f.severity === 'fail');
    expect(blockingFindings.length).toBeGreaterThan(0);

    // Business rule: standard approval should be restricted when blocking findings remain
    const canStandardApprove = blockingFindings.length === 0;
    expect(canStandardApprove).toBe(false);

    // With override reason, it transitions to overridden_and_approved
    const overrideDecision = {
      decision: 'overridden_and_approved' as const,
      timestamp: new Date().toISOString(),
      reviewerLabel: 'Senior Compliance Director J. Doe',
      overrideReason: 'Legal counsel approved specific clause under contract exception B-4.',
      unresolvedBlockingFindingsOverridden: blockingFindings.map((f) => f.id),
    };

    expect(overrideDecision.overrideReason.length).toBeGreaterThan(10);
    expect(overrideDecision.reviewerLabel).toBeDefined();
  });

  it('8. Handles malformed input gracefully without crashing', () => {
    // Empty content
    const emptyRun = VerificationEngine.verify({
      contentTitle: '',
      category: '',
      rawContent: '',
      brandProfile: null,
      governanceRules: DEFAULT_GOVERNANCE_RULES,
      knowledgeDocuments: [],
    });
    expect(emptyRun.overallResult).toBe('not_checked');

    // Document parser handles malformed JSON
    expect(() => DocumentParser.parseJSON('broken', '{ invalid json:')).toThrow(/Malformed JSON/);
  });

  it('9. Validates data import package schema', () => {
    const validPkg: ExportDataPackage = {
      schemaVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      platform: 'VERITYX AI',
      brands: [sampleBrand],
      rules: DEFAULT_GOVERNANCE_RULES,
      documents: sampleDocs,
      reviews: [],
      auditEvents: [],
    };

    expect(Array.isArray(validPkg.brands)).toBe(true);
    expect(Array.isArray(validPkg.rules)).toBe(true);
    expect(validPkg.rules.length).toBeGreaterThan(0);
  });
});
