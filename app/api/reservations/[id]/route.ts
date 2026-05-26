import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        inventory: {
          include: {
            product: true,
            warehouse: true,
          },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    const isExpired = reservation.status === 'PENDING' && reservation.expiresAt < new Date();

    const formatted = {
      id: reservation.id,
      inventoryId: reservation.inventoryId,
      productId: reservation.inventory.productId,
      productName: reservation.inventory.product.name,
      warehouseId: reservation.inventory.warehouseId,
      warehouseName: reservation.inventory.warehouse.name,
      quantity: reservation.quantity,
      status: isExpired ? 'EXPIRED' : reservation.status,
      expiresAt: reservation.expiresAt,
      createdAt: reservation.createdAt,
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error(`Error fetching reservation ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch reservation details' },
      { status: 500 }
    );
  }
}
