import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { BadRequestError } from '@/lib/errors';

export class IdempotencyService {
  /**
   * Helper to calculate a deterministic SHA-256 hash of a JSON body.
   */
  private static calculateBodyHash(body: any): string {
    const serialized = body ? JSON.stringify(body) : '';
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Checks if an idempotency key already exists.
   * If it exists, returns the cached response and status.
   * Throws a BadRequestError if the key is reused for a different path or body payload.
   */
  static async checkIdempotency(key: string, path: string, body: any) {
    const record = await prisma.idempotencyRecord.findUnique({
      where: { key },
    });

    if (!record) {
      return null;
    }

    const currentHash = this.calculateBodyHash(body);

    // Safety checks: Enforce that the same key cannot be reused for different endpoints or payloads
    if (record.path !== path || record.bodyHash !== currentHash) {
      throw new BadRequestError(
        'Idempotency Key Collision: This key has already been used for a different request payload or endpoint.'
      );
    }

    return {
      status: record.status,
      response: JSON.parse(record.response),
    };
  }

  /**
   * Commits the completed response and status to the idempotency database.
   */
  static async saveResponse(key: string, path: string, body: any, response: any, status: number) {
    const bodyHash = this.calculateBodyHash(body);

    try {
      await prisma.idempotencyRecord.create({
        data: {
          key,
          path,
          bodyHash,
          response: JSON.stringify(response),
          status,
        },
      });
    } catch (err) {
      // If there is an insert crash due to concurrent identical keys, log and suppress it,
      // as it will be caught on the next retry.
      console.warn(`Idempotency key ${key} already persisted or conflicted during save:`, err);
    }
  }
}
