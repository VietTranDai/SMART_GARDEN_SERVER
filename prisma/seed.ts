// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { seedProvinces } from './seeds/province_data/seedProvinces';
import { seedRoles } from './seeds/role_data/seedRoles';
import { seedUsers } from './seeds/user_data/seedUsers';
import { seedPlants } from './seeds/plant_data/seedPlants';
import { seedExperienceLevels } from './seeds/seed_experience_levels/seed-experience-levels';
import { seedPlantTypes } from './seeds/plant_data/seedPlantTypes';
import { seedGardens } from './seeds/garden_data/seedGardens';
import { seedGardeners } from './seeds/user_data/seedGardeners';

const prisma = new PrismaClient();

async function main() {
  await seedExperienceLevels(prisma);
  await seedProvinces(prisma);
  await seedRoles(prisma);
  await seedUsers(prisma);
  await seedGardeners(prisma)
  await seedPlantTypes(prisma);
  await seedPlants(prisma);
  await seedGardens(prisma)

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
