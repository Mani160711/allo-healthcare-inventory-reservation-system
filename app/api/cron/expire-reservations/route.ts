import { NextRequest, NextResponse } from 'next/server';
import { ReservationService } from '@/services/reservation.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('Authorization');

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const expiredReleasedCount = await ReservationService.processExpiredReservations();
    return NextResponse.json({
      success: true,
      message: 'Expired reservations processed successfully.',
      expiredReleasedCount,
    });
  } catch (error) {
    console.error('Error sweeping expired reservations:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during the expiry sweep.' },
      { status: 500 }
    );
  }
}


export async function GET(req: NextRequest) {
  return POST(req);
}
