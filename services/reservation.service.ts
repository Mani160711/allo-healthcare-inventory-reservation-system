import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import {
  InsufficientStockError,
  ReservationExpiredError,
  ConcurrencyConflictError,
  NotFoundError,
  BadRequestError,
} from '@/lib/errors';

export class ReservationService {
  /**
   * Atomically creates a PENDING reservation for a product in a warehouse.
   * Leverages Prisma Interactive Transactions with Serializable isolation level.
   */
  static async createReservation(
    productId: string,
    warehouseId: string,
    quantity: number
  ) {
    if (quantity <= 0) {
      throw new BadRequestError('Quantity must be greater than 0');
    }

    try {
      return await prisma.$transaction(
        async (tx) => {
          // 1. Fetch the Inventory record matching the Product and Warehouse
          const inventory = await tx.inventory.findFirst({
            where: {
              productId,
              warehouseId,
            },
          });

          if (!inventory) {
            throw new NotFoundError(
              'No inventory record found for the specified product and warehouse.'
            );
          }

          // 2. Enforce constraint: quantity must not exceed available stock
          const availableStock = inventory.totalStock - inventory.reservedStock;
          if (availableStock < quantity) {
            throw new InsufficientStockError(
              `Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`
            );
          }

          // 3. Atomically update the Inventory reservedStock
          const updatedInventory = await tx.inventory.update({
            where: { id: inventory.id },
            data: {
              reservedStock: { increment: quantity },
            },
          });

          // Extra safety check in case check constraint was bypassed
          if (
            updatedInventory.reservedStock < 0 ||
            updatedInventory.reservedStock > updatedInventory.totalStock
          ) {
            throw new InsufficientStockError(
              'Stock allocation violated inventory constraints.'
            );
          }

          // 4. Create the Reservation record
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
          const reservation = await tx.reservation.create({
            data: {
              inventoryId: inventory.id,
              quantity,
              status: 'PENDING',
              expiresAt,
            },
          });

          return {
            reservationId: reservation.id,
            expiresAt: reservation.expiresAt,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }
      );
    } catch (error) {
      // Catch PostgreSQL serialization failure (Prisma Error Code P2034)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        throw new ConcurrencyConflictError(
          'A concurrent update conflict occurred on this inventory row. Please retry.'
        );
      }
      throw error;
    }
  }

  /**
   * Confirms a PENDING reservation, converting reserved stock to permanent sale.
   * Leverages Prisma Interactive Transactions with Serializable isolation level.
   */
  static async confirmReservation(reservationId: string) {
    // 1. Fetch reservation details along with current inventory
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { inventory: true },
    });

    if (!reservation) {
      throw new NotFoundError('Reservation not found.');
    }

    // 2. If already confirmed, nothing to do
    if (reservation.status === 'CONFIRMED') {
      return;
    }

    // 3. Check for expiration - trigger active release if expired and PENDING
    const isExpired = reservation.expiresAt < new Date();
    if (reservation.status === 'RELEASED' || isExpired) {
      if (reservation.status === 'PENDING') {
        try {
          await prisma.$transaction(
            async (tx) => {
              await tx.reservation.update({
                where: { id: reservationId },
                data: { status: 'RELEASED' },
              });

              await tx.inventory.update({
                where: { id: reservation.inventoryId },
                data: {
                  reservedStock: { decrement: reservation.quantity },
                },
              });
            }
          );
          console.log(`⏰ Atomically released late-checkout reservation in DB: ${reservationId}`);
        } catch (txError) {
          console.warn(`Late-release transaction conflicted or failed for ${reservationId}:`, txError);
        }
      }
      throw new ReservationExpiredError(
        'This reservation has expired and cannot be confirmed.'
      );
    }

    if (reservation.status !== 'PENDING') {
      throw new BadRequestError(
        `Cannot confirm a reservation with status: ${reservation.status}`
      );
    }

    // 4. Proceed with confirmation transaction
    try {
      await prisma.$transaction(
        async (tx) => {
          // Re-fetch inside transaction for concurrency safety
          const currentRes = await tx.reservation.findUnique({
            where: { id: reservationId },
          });

          if (!currentRes || currentRes.status !== 'PENDING') {
            throw new BadRequestError('Reservation is no longer PENDING.');
          }

          // Update the reservation status to CONFIRMED
          await tx.reservation.update({
            where: { id: reservationId },
            data: { status: 'CONFIRMED' },
          });

          // Convert reservedStock to permanent sale by deducting from both totalStock and reservedStock
          await tx.inventory.update({
            where: { id: reservation.inventoryId },
            data: {
              totalStock: { decrement: reservation.quantity },
              reservedStock: { decrement: reservation.quantity },
            },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        throw new ConcurrencyConflictError(
          'A concurrent update conflict occurred. Please retry.'
        );
      }
      throw error;
    }
  }

  /**
   * Voluntarily cancels and releases a PENDING reservation, restoring reserved stock.
   * Leverages Prisma Interactive Transactions with Serializable isolation level.
   */
  static async releaseReservation(reservationId: string) {
    try {
      await prisma.$transaction(
        async (tx) => {
          // 1. Fetch reservation details
          const reservation = await tx.reservation.findUnique({
            where: { id: reservationId },
          });

          if (!reservation) {
            throw new NotFoundError('Reservation not found.');
          }

          // 2. If already released or confirmed, do nothing
          if (reservation.status !== 'PENDING') {
            return;
          }

          // 3. Mark as RELEASED
          await tx.reservation.update({
            where: { id: reservationId },
            data: { status: 'RELEASED' },
          });

          // 4. Atomically decrement reservedStock in inventory
          await tx.inventory.update({
            where: { id: reservation.inventoryId },
            data: {
              reservedStock: { decrement: reservation.quantity },
            },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        throw new ConcurrencyConflictError(
          'A concurrent update conflict occurred. Please retry.'
        );
      }
      throw error;
    }
  }

  /**
   * Scans and releases all PENDING reservations that have passed their expiresAt date.
   */
  static async processExpiredReservations() {
    console.log('⏰ Starting expired reservations cleanup sweep...');
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    let count = 0;
    for (const res of expiredReservations) {
      try {
        await this.releaseReservation(res.id);
        count++;
        console.log(`✅ Automatically expired and released reservation: ${res.id}`);
      } catch (err) {
        console.error(`❌ Failed to automatically release reservation ${res.id}:`, err);
      }
    }
    console.log(`⏰ Expiry sweep completed. Released ${count} reservations.`);
    return count;
  }
}
