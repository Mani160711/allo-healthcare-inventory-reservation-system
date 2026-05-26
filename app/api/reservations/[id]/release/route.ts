import { NextRequest, NextResponse } from 'next/server';
import { ReservationService } from '@/services/reservation.service';
import { NotFoundError, ConcurrencyConflictError } from '@/lib/errors';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await ReservationService.releaseReservation(id);
    return NextResponse.json({ success: true, message: 'Reservation released and stock returned.' });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ConcurrencyConflictError) {
      return NextResponse.json(
        { error: 'System is busy processing this release. Please retry.' },
        { status: 409 }
      );
    }

    console.error(`Error releasing reservation ${id}:`, error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during cancellation.' },
      { status: 500 }
    );
  }
}
