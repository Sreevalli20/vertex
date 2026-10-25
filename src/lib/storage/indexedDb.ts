/**
 * Browser-native IndexedDB persistence engine for VERITYX AI
 * High reliability, typed operations, schema migrations, and export/import.
 */

import {
  BrandProfile,
  GovernanceRule,
  KnowledgeDocument,
  VerificationRun,
  AuditEvent,
  ExportDataPackage,
} from '../../types';
import { DEFAULT_GOVERNANCE_RULES } from '../engine/defaultRules';

const DB_NAME = 'verityx_ai_db';
const DB_VERSION = 1;

export class StorageEngine {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this runtime environment.'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        // Create stores if they do not exist
        if (!db.objectStoreNames.contains('brands')) {
          db.createObjectStore('brands', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('rules')) {
          db.createObjectStore('rules', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('reviews')) {
          const reviewStore = db.createObjectStore('reviews', { keyPath: 'id' });
          reviewStore.createIndex('createdAt', 'createdAt', { unique: false });
          reviewStore.createIndex('brandProfileId', 'brandProfileId', { unique: false });
        }
        if (!db.objectStoreNames.contains('audit_events')) {
          const auditStore = db.createObjectStore('audit_events', { keyPath: 'id' });
          auditStore.createIndex('timestamp', 'timestamp', { unique: false });
          auditStore.createIndex('eventType', 'eventType', { unique: false });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        resolve(db);
      };

      request.onerror = () => {
        reject(request.error || new Error('Failed to open IndexedDB'));
      };
    });

    return this.dbPromise;
  }

  // --- Initializer & Default Rules Seeder ---
  public async initialize(): Promise<void> {
    const rules = await this.getAllRules();
    if (rules.length === 0) {
      for (const rule of DEFAULT_GOVERNANCE_RULES) {
        await this.saveRule(rule);
      }
    }
  }

  // --- Brand Profiles CRUD ---
  public async getAllBrands(): Promise<BrandProfile[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('brands', 'readonly');
      const store = tx.objectStore('brands');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  public async getBrand(id: string): Promise<BrandProfile | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('brands', 'readonly');
      const store = tx.objectStore('brands');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  public async saveBrand(brand: BrandProfile): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('brands', 'readwrite');
      const store = tx.objectStore('brands');
      const request = store.put(brand);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async deleteBrand(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('brands', 'readwrite');
      const store = tx.objectStore('brands');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- Governance Rules CRUD ---
  public async getAllRules(): Promise<GovernanceRule[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('rules', 'readonly');
      const store = tx.objectStore('rules');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  public async saveRule(rule: GovernanceRule): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('rules', 'readwrite');
      const store = tx.objectStore('rules');
      const request = store.put(rule);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async deleteRule(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('rules', 'readwrite');
      const store = tx.objectStore('rules');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- Approved Knowledge Base CRUD ---
  public async getAllDocuments(): Promise<KnowledgeDocument[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('documents', 'readonly');
      const store = tx.objectStore('documents');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  public async getDocument(id: string): Promise<KnowledgeDocument | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('documents', 'readonly');
      const store = tx.objectStore('documents');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  public async saveDocument(doc: KnowledgeDocument): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('documents', 'readwrite');
      const store = tx.objectStore('documents');
      const request = store.put(doc);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async deleteDocument(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('documents', 'readwrite');
      const store = tx.objectStore('documents');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- Reviews CRUD ---
  public async getAllReviews(): Promise<VerificationRun[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('reviews', 'readonly');
      const store = tx.objectStore('reviews');
      const request = store.getAll();
      request.onsuccess = () => {
        const results = (request.result || []) as VerificationRun[];
        // Sort descending by creation date
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  public async getReview(id: string): Promise<VerificationRun | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('reviews', 'readonly');
      const store = tx.objectStore('reviews');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  public async saveReview(review: VerificationRun): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('reviews', 'readwrite');
      const store = tx.objectStore('reviews');
      const request = store.put(review);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async deleteReview(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('reviews', 'readwrite');
      const store = tx.objectStore('reviews');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- Audit Trail (Append-Only) ---
  public async getAllAuditEvents(): Promise<AuditEvent[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('audit_events', 'readonly');
      const store = tx.objectStore('audit_events');
      const request = store.getAll();
      request.onsuccess = () => {
        const events = (request.result || []) as AuditEvent[];
        events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(events);
      };
      request.onerror = () => reject(request.error);
    });
  }

  public async appendAuditEvent(event: AuditEvent): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('audit_events', 'readwrite');
      const store = tx.objectStore('audit_events');
      const request = store.add(event);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- Full Database Backup / Export ---
  public async exportAllData(): Promise<ExportDataPackage> {
    const [brands, rules, documents, reviews, auditEvents] = await Promise.all([
      this.getAllBrands(),
      this.getAllRules(),
      this.getAllDocuments(),
      this.getAllReviews(),
      this.getAllAuditEvents(),
    ]);

    return {
      schemaVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      platform: 'VERITYX AI Local Governance Platform',
      brands,
      rules,
      documents,
      reviews,
      auditEvents,
    };
  }

  // --- Full Database Import with Schema Validation ---
  public async importData(pkg: ExportDataPackage): Promise<{ success: boolean; message: string; counts: Record<string, number> }> {
    if (!pkg || typeof pkg !== 'object' || !Array.isArray(pkg.rules)) {
      throw new Error('Invalid export package: Missing root structures.');
    }

    const counts = {
      brands: 0,
      rules: 0,
      documents: 0,
      reviews: 0,
      auditEvents: 0,
    };

    if (Array.isArray(pkg.brands)) {
      for (const brand of pkg.brands) {
        if (brand.id && brand.name) {
          await this.saveBrand(brand);
          counts.brands++;
        }
      }
    }

    if (Array.isArray(pkg.rules)) {
      for (const rule of pkg.rules) {
        if (rule.id && rule.name) {
          await this.saveRule(rule);
          counts.rules++;
        }
      }
    }

    if (Array.isArray(pkg.documents)) {
      for (const doc of pkg.documents) {
        if (doc.id && doc.title) {
          await this.saveDocument(doc);
          counts.documents++;
        }
      }
    }

    if (Array.isArray(pkg.reviews)) {
      for (const rev of pkg.reviews) {
        if (rev.id && rev.contentTitle) {
          await this.saveReview(rev);
          counts.reviews++;
        }
      }
    }

    if (Array.isArray(pkg.auditEvents)) {
      for (const evt of pkg.auditEvents) {
        if (evt.id && evt.eventType) {
          // Add to store if not duplicate
          try {
            await this.appendAuditEvent(evt);
            counts.auditEvents++;
          } catch {
            // ignore if key exists
          }
        }
      }
    }

    return {
      success: true,
      message: `Successfully imported ${counts.brands} brands, ${counts.rules} rules, ${counts.documents} documents, and ${counts.reviews} reviews.`,
      counts,
    };
  }

  // --- Clear Database ---
  public async clearAllData(): Promise<void> {
    const db = await this.getDB();
    const storeNames = ['brands', 'rules', 'documents', 'reviews', 'audit_events'];
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeNames, 'readwrite');
      for (const name of storeNames) {
        tx.objectStore(name).clear();
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const storage = new StorageEngine();
