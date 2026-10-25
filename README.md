# VERITYX AI — Brand Integrity & Content Governance Platform

VERITYX AI is a client-first, enterprise-grade brand integrity and content governance platform. It allows organizations to verify marketing copy, press releases, website content, and product descriptions against approved brand guidelines, reference documents, factual specifications, and deterministic governance policies before publication.

All verification logic runs 100% locally in the browser. It requires **no external API keys, no paid subscriptions, no cloud AI model dependencies, and transmits zero data to external endpoints**.

🌐 **Live Demo**: https://verityx-ai-brand-integrity-platform.vercel.app

📦 **GitHub Repository**: https://github.com/Sreevalli20/vertex

---

## 🚀 Setup, Run, Test, and Build Commands

### Prerequisites
- Node.js (v18+ recommended)
- npm or pnpm

### Installation
```bash
npm install
```

### Development Server
Starts the local dev server at `http://localhost:3000`:
```bash
npm run dev
```

### Automated Test Suite
Runs the Vitest test runner validating all required verification scenarios:
```bash
npm test
```

### Type Checking & Linting
```bash
npm run lint
```

### Production Build
Generates a minified, production-ready static bundle in `/dist`:
```bash
npm run build
```

---

## 🎯 Verified Working Capabilities

1. **Deterministic Local Verification Engine**
   - **Brand Terminology Consistency**: Enforces canonical brand names and flags deprecated aliases.
   - **Prohibited Terminology**: Detects restricted phrases, colloquialisms, and hyperbole (e.g. "dirt cheap", "foolproof", "magic bullet") and suggests approved alternatives.
   - **Absolute & Guaranteed Language**: Flags legally hazardous claims (e.g., "100% guaranteed", "completely risk-free", "fail-safe").
   - **Unsupported Superlatives**: Identifies ungrounded superlatives (e.g., "world's best", "unrivaled", "the only true").
   - **Mandatory Disclaimers**: Detects whether configured legal disclaimers are present in the text verbatim or with token-overlap threshold.
   - **Repeated & Duplicate Copy**: Flags duplicated paragraphs or sentences across content blocks.
   - **Safe Regular Expression Rules**: Supports user-defined regex rules with syntax protection and execution limits.

2. **Knowledge-Grounded Evidence Matcher**
   - **Quantitative Claim Grounding**: Extracts numerical stats, percentages, currency, and multipliers (e.g., "99.995%", "4.2x", "$1,200/month", "12ms").
   - **Lexical Reference Search**: Matches claims against uploaded knowledge documents, extracting source excerpts, document titles, and confidence scores.
   - **Honest Evidence Reporting**: Unverified numbers are labeled as "unverified missing evidence", clearly distinguished from rule violations.

3. **Multi-Format Document Ingestion**
   - Native client-side parsing of **TXT, Markdown (.md), CSV, and JSON** files.
   - Size limit validation (5 MB local threshold) and malformed file recovery.
   - Manual fact entry editor for quick specification citations.

4. **Brand Profile Management**
   - Create, edit, and delete customized brand profiles.
   - Configurable approved product names, prohibited terms dictionary with reasons and replacements, canonical term pairs, tone guidelines, and required disclaimers.

5. **Human Review & Governance Workflow**
   - Explicit review lifecycle: `Draft` → `Analyzed` → `Changes Required` → `Ready for Human Review` → `Approved` / `Rejected`.
   - **Blocking Rule Enforcement**: Prevents publication approval when blocking violations exist, unless an authorized reviewer records a mandatory exception reason.
   - Records reviewer label, timestamp, and audit notes.

6. **Persistent Local IndexedDB Storage**
   - Native browser IndexedDB storage for brands, rules, documents, verification runs, and audit logs.
   - Complete export of all data to JSON backup.
   - Schema-validated import of database packages.
   - Complete data purge with explicit safety confirmation.

7. **Printable Executive Reports & Multi-Format Export**
   - One-click browser print-to-PDF layout formatted for executive review.
   - Raw JSON export of verification run object.
   - CSV export of all findings and evidence citations.

8. **Append-Only Audit Trail**
   - Chronological logging of brand updates, rule toggles, document ingestion, verification runs, approvals, and overrides.
   - Detailed event payloads with inspection drawer.

---

## 🔍 Known Architecture Boundaries & Limitations

- **Scope of Local Deterministic Checking**: The platform verifies rule patterns, phrase boundaries, and lexical overlap against approved documents. It does not possess general world knowledge, nor does it browse the live internet.
- **Evidence vs. Truth**: Lack of evidence in approved documents flags an unverified claim, not proof that the statement is factually false.
- **Audit Storage Context**: Reviewer names serve as operational audit labels within the browser session rather than cryptographic multi-tenant enterprise authentication.
- **Zero Data Egress**: All text, documents, and audit logs remain strictly within the current browser profile unless explicitly exported.
