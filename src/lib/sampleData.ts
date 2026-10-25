/**
 * Clearly labeled optional sample dataset for VERITYX AI
 * Seeding realistic enterprise data for onboarding demonstration.
 */

import { BrandProfile, KnowledgeDocument, GovernanceRule } from '../types';
import { DEFAULT_GOVERNANCE_RULES } from './engine/defaultRules';

export const SAMPLE_BRAND_PROFILE: BrandProfile = {
  id: 'brand-auracloud-sample',
  name: 'AuraCloud Enterprise',
  description: 'Enterprise resilient cloud data architecture and edge mesh services.',
  tagline: 'The Unified Resilient Cloud Architecture',
  approvedProductNames: ['AuraCloud Core', 'AuraDB Distributed', 'AuraMesh Gateway'],
  approvedTerminology: [
    {
      original: 'Aura Core',
      canonical: 'AuraCloud Core',
      context: 'Always refer to the flagship platform with the complete brand name "AuraCloud Core".',
    },
    {
      original: 'indestructible system',
      canonical: 'resilient infrastructure',
      context: 'Do not use hyperbole; use "resilient infrastructure".',
    },
    {
      original: 'never-failing servers',
      canonical: 'high availability architecture',
      context: 'Use industry-standard SLA language.',
    },
  ],
  prohibitedTerminology: [
    {
      term: 'foolproof',
      reason: 'Unprofessional hyperbole; implies condescension and unachievable guarantees.',
      suggestedAlternative: 'resilient and intuitive',
    },
    {
      term: '100% uptime',
      reason: 'Legally prohibited claim without contractual caveats.',
      suggestedAlternative: '99.995% SLA availability',
    },
    {
      term: 'dirt cheap',
      reason: 'Devalues enterprise premium positioning.',
      suggestedAlternative: 'cost-effective pricing tier',
    },
    {
      term: 'magic bullet',
      reason: 'Unsubstantiated marketing cliché.',
      suggestedAlternative: 'comprehensive platform solution',
    },
  ],
  requiredDisclaimers: [
    {
      id: 'disc-aura-01',
      name: 'Environment & Benchmark Variability Disclaimer',
      text: 'Results may vary depending on infrastructure, workload configuration, and operating conditions.',
      appliesTo: 'All marketing copy containing numerical speedups or benchmark claims.',
    },
  ],
  toneGuidelines: [
    'Direct, authoritative, technically rigorous.',
    'Back every quantitative metric with verified benchmark citations.',
    'Never promise unconditional zero-downtime or total risk immunity.',
  ],
  customRules: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const SAMPLE_KNOWLEDGE_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: 'doc-benchmarks-2026',
    title: 'AuraCloud 2026 Audited Performance Benchmarks & Hardware Specs',
    category: 'benchmarks',
    fileType: 'txt',
    characterCount: 1420,
    wordCount: 195,
    parsedFactsCount: 12,
    summary: 'Audited laboratory benchmark data covering throughput, latency, and uptime SLA targets.',
    content: `AuraCloud Official Benchmark & Specifications Reference (Audited Q3 2026)

1. High Availability Target:
AuraDB Distributed achieves 99.995% SLA availability across multi-region active-active deployments.

2. Throughput Multipliers:
In standardized YCSB workload tests, AuraMesh Gateway delivered 4.2x faster request throughput compared to standard open-source edge proxies under 100,000 concurrent connections.

3. Latency Metrics:
p95 write latency was audited at 12ms under steady-state load of 50,000 write operations per second.
Median p50 read latency across edge nodes measured 3.8ms.

4. Infrastructure Capacity:
AuraCloud Core clusters scale dynamically up to 256 nodes per tenant cluster with zero cold-restart delay.

5. Commercial Pricing:
Enterprise tier pricing starts at $1,200/month for foundational nodes, billed annually.`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'doc-compliance-cert',
    title: 'AuraCloud Information Security & Certifications Attestation',
    category: 'certifications',
    fileType: 'md',
    characterCount: 950,
    wordCount: 130,
    parsedFactsCount: 8,
    summary: 'Third-party auditor compliance attestations including SOC 2 Type II and ISO 27001:2022.',
    content: `# Security & Compliance Attestation Document

- SOC 2 Compliance: AuraCloud maintains active SOC 2 Type II compliance audited by Ernst & Young LLP.
- ISO Certification: ISO 27001:2022 certified across all global data center zones.
- Encryption Standards: All customer data is encrypted at rest using AES-256 and in transit using TLS 1.3.
- Data Sovereignty: EU and UK customer records remain strictly isolated within Frankfurt and Dublin regions.`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const SAMPLE_MARKETING_DRAFT = {
  title: 'AuraCloud Q4 Global Launch — Scale Without Friction',
  category: 'Website Copy',
  content: `Transform your distributed data architecture with AuraCore.

Our revolutionary platform guarantees 100% uptime with a completely foolproof edge gateway that makes high availability a dirt cheap reality for any engineering team.

In audited tests, AuraDB Distributed achieves 99.995% SLA availability across global regions, while our edge layer delivers an unprecedented 10x speed boost for every API request. It is the world's best distributed platform.

Join thousands of modern enterprises running mission-critical workloads today.`,
};

export const INITIAL_RULES: GovernanceRule[] = DEFAULT_GOVERNANCE_RULES;
