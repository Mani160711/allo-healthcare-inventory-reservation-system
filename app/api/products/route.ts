import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        inventories: {
          include: {
            warehouse: true,
          },
          orderBy: {
            warehouse: {
              name: 'asc',
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      createdAt: product.createdAt,
      inventories: product.inventories.map((inv) => ({
        id: inv.id,
        warehouse: {
          id: inv.warehouse.id,
          name: inv.warehouse.name,
        },
        totalStock: inv.totalStock,
        reservedStock: inv.reservedStock,
        availableStock: inv.totalStock - inv.reservedStock,
      })),
    }));

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
