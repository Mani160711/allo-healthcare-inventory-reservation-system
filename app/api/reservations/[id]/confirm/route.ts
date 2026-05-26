import { NextRequest, NextResponse } from 'next/server';
import { ReservationService } from '@/services/reservation.service';
import {
  NotFoundError,
  ReservationExpiredError,
  ConcurrencyConflictError,
  BadRequestError,
} from '@/lib/errors';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await ReservationService.confirmReservation(id);
    return NextResponse.json({ success: true, message: 'Reservation confirmed successfully.' });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ReservationExpiredError) {
      return NextResponse.json({ error: error.message }, { status: 410 });
    }
    if (error instanceof ConcurrencyConflictError) {
      return NextResponse.json(
        { error: 'System is busy processing this reservation. Please retry.' },
        { status: 409 }
      );
    }
    if (error instanceof BadRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(`Error confirming reservation ${id}:`, error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during confirmation.' },
      { status: 500 }
    );
  }
}
