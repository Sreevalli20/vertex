/**
 * Append-only audit logger for VERITYX AI
 * Transparently records operational history in IndexedDB.
 */

import { storage } from '../storage/indexedDb';
import { AuditEvent } from '../../types';

export class AuditLogger {
  private static defaultActor = 'Local Reviewer (Browser Session)';

  public static async log(
    eventType: AuditEvent['eventType'],
    recordId: string,
    recordTitle: string,
    details: Record<string, unknown> = {},
    actorLabel?: string
  ): Promise<AuditEvent> {
    const event: AuditEvent = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date().toISOString(),
      eventType,
      recordId,
      recordTitle,
      details,
      actorLabel: actorLabel || this.defaultActor,
    };

    try {
      await storage.appendAuditEvent(event);
    } catch (err) {
      console.warn('Audit log write error:', err);
    }

    return event;
  }
}
