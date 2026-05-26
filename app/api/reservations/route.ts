import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ReservationService } from '@/services/reservation.service';
import { IdempotencyService } from '@/services/idempotency.service';
import {
  InsufficientStockError,
  ConcurrencyConflictError,
  NotFoundError,
  BadRequestError,
} from '@/lib/errors';

const reservationSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  warehouseId: z.string().min(1, 'Warehouse ID is required'),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .gt(0, 'Quantity must be greater than 0'),
});

export async function POST(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const idempotencyKey = req.headers.get('Idempotency-Key');

  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid JSON request body' },
      { status: 400 }
    );
  }

  
  if (idempotencyKey) {
    try {
      const cached = await IdempotencyService.checkIdempotency(
        idempotencyKey,
        path,
        body
      );
      if (cached) {
        console.log(`⚡ Idempotency Cache Hit for key: ${idempotencyKey}`);
        return NextResponse.json(cached.response, { status: cached.status });
      }
    } catch (error) {
      if (error instanceof BadRequestError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      console.error('Idempotency check error:', error);
    }
  }

  
  const validation = reservationSchema.safeParse(body);
  if (!validation.success) {
    const formattedErrors = validation.error.issues.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    }));

    const errorResponse = { errors: formattedErrors };

    
    if (idempotencyKey) {
      await IdempotencyService.saveResponse(
        idempotencyKey,
        path,
        body,
        errorResponse,
        400
      );
    }

    return NextResponse.json(errorResponse, { status: 400 });
  }

  const { productId, warehouseId, quantity } = validation.data;

  
  try {
    const result = await ReservationService.createReservation(
      productId,
      warehouseId,
      quantity
    );

    
    if (idempotencyKey) {
      await IdempotencyService.saveResponse(
        idempotencyKey,
        path,
        body,
        result,
        201
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    let status = 500;
    let errorPayload: { error: string } | { errors: { path: string; message: string }[] } = {
      error: 'An unexpected error occurred',
    };

    if (error instanceof InsufficientStockError) {
      status = 409;
      errorPayload = { error: 'Insufficient inventory available at selected warehouse.' };
    } else if (error instanceof ConcurrencyConflictError) {
      status = 409;
      errorPayload = { error: 'System is busy processing requests for this item. Please try again.' };
    } else if (error instanceof NotFoundError) {
      status = 404;
      errorPayload = { error: error.message };
    } else if (error instanceof BadRequestError) {
      status = 400;
      errorPayload = { error: error.message };
    } else {
      console.error('Error creating reservation:', error);
    }

    
    if (idempotencyKey && status !== 500) {
      await IdempotencyService.saveResponse(
        idempotencyKey,
        path,
        body,
        errorPayload,
        status
      );
    }

    return NextResponse.json(errorPayload, { status });
  }
}

export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        inventory: {
          include: {
            product: true,
            warehouse: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formatted = reservations.map((res) => {
      const isExpired = res.status === 'PENDING' && res.expiresAt < new Date();
      return {
        id: res.id,
        productId: res.inventory.productId,
        productName: res.inventory.product.name,
        warehouseId: res.inventory.warehouseId,
        warehouseName: res.inventory.warehouse.name,
        quantity: res.quantity,
        status: isExpired ? 'EXPIRED' : res.status,
        expiresAt: res.expiresAt,
        createdAt: res.createdAt,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservations history' },
      { status: 500 }
    );
  }
}
