// prisma/seed.ts
import { Prisma, PrismaClient } from '@prisma/client';
import { seedProvinces } from './seeds/province_data/seedProvinces';
import { seedRoles } from './seeds/role_data/seedRoles';
import { seedUsers } from './seeds/user_data/seedUsers';
import { seedPlantTypes } from './seeds/plant_data/seedPlants';
import { seedExperienceLevels } from './seed/experience-levels';

const prisma = new PrismaClient();

async function main() {
  // Seed dữ liệu theo thứ tự phụ thuộc
  await seedProvinces(prisma);
  await seedRoles(prisma);
  await seedExperienceLevels(prisma);
  await seedUsers(prisma);
  await seedPlantTypes(prisma);

  console.log('Tất cả dữ liệu đã được seed thành công!');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
