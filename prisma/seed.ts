import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean up existing records to make seed repeatable
  console.log('🧹 Cleaning up database...');
  await prisma.idempotencyRecord.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.product.deleteMany();

  // 2. Insert 5 clinical healthcare Products
  console.log('📦 Creating products...');
  const products = await Promise.all([
    prisma.product.create({ data: { name: 'Bio-Defense Influenza Vaccine (A/H1N1)' } }),
    prisma.product.create({ data: { name: 'Rapid SARS-CoV-2 Antigen Test Kits' } }),
    prisma.product.create({ data: { name: 'Critical-Care Patient Ventilator (V5-A)' } }),
    prisma.product.create({ data: { name: 'Sterile Surgical Gloves (Latex-Free)' } }),
    prisma.product.create({ data: { name: 'Adrenaline (Epinephrine) Injection Batches' } }),
  ]);

  // 3. Insert 3 clinical medical Warehouses
  console.log('🏢 Creating warehouses...');
  const warehouses = await Promise.all([
    prisma.warehouse.create({ data: { name: 'East Coast Clinical Supply Hub' } }),
    prisma.warehouse.create({ data: { name: 'West Coast Bio-Storage Depot' } }),
    prisma.warehouse.create({ data: { name: 'Midwest Pharmaceutical Storage' } }),
  ]);

  // 4. Create Inventory Mappings with matching quantities
  // Product 0: Influenza Vaccine - high available stock (25 in WH0, 5 in WH1, 12 in WH2)
  // Product 1: Antigen Kits - low stock (3, 2, 4)
  // Product 2: Ventilators - exactly 1 stock in WH0 (critical for serializable concurrency testing!), 0 in WH1, 5 in WH2
  // Product 3: Surgical Gloves - medium stock (15, 18, 20)
  // Product 4: Adrenaline - completely out of stock everywhere (0 stock)
  console.log('📊 Creating inventories...');
  const inventoryConfigurations = [
    // Product 0: Bio-Defense Influenza Vaccine
    { productIndex: 0, warehouseIndex: 0, totalStock: 25 },
    { productIndex: 0, warehouseIndex: 1, totalStock: 5 },
    { productIndex: 0, warehouseIndex: 2, totalStock: 12 },

    // Product 1: Rapid SARS-CoV-2 Antigen Test Kits
    { productIndex: 1, warehouseIndex: 0, totalStock: 3 },
    { productIndex: 1, warehouseIndex: 1, totalStock: 2 },
    { productIndex: 1, warehouseIndex: 2, totalStock: 4 },

    // Product 2: Critical-Care Patient Ventilator
    { productIndex: 2, warehouseIndex: 0, totalStock: 1 }, // Critical for concurrency tests!
    { productIndex: 2, warehouseIndex: 1, totalStock: 0 },
    { productIndex: 2, warehouseIndex: 2, totalStock: 5 },

    // Product 3: Sterile Surgical Gloves
    { productIndex: 3, warehouseIndex: 0, totalStock: 15 },
    { productIndex: 3, warehouseIndex: 1, totalStock: 18 },
    { productIndex: 3, warehouseIndex: 2, totalStock: 20 },

    // Product 4: Adrenaline Injection Batches
    { productIndex: 4, warehouseIndex: 0, totalStock: 0 }, // Out of stock testing!
    { productIndex: 4, warehouseIndex: 1, totalStock: 0 },
    { productIndex: 4, warehouseIndex: 2, totalStock: 0 },
  ];

  for (const config of inventoryConfigurations) {
    const product = products[config.productIndex];
    const warehouse = warehouses[config.warehouseIndex];

    await prisma.inventory.create({
      data: {
        productId: product.id,
        warehouseId: warehouse.id,
        totalStock: config.totalStock,
        reservedStock: 0,
      },
    });
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
