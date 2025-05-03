import { PrismaClient } from '@prisma/client';

export async function seedGardeners(prisma: PrismaClient): Promise<void> {
  const superGardenerUser = await prisma.user.findUnique({
    where: { username: 'supergardener' },
  });

  if (!superGardenerUser) {
    throw new Error(
      'User "supergardener" chưa được seed. Vui lòng chạy seedUsers trước.',
    );
  }

  const level = await prisma.experienceLevel.findUnique({
    where: { level: 6 },
  });

  await prisma.gardener.upsert({
    where: { userId: superGardenerUser.id },
    update: {
      // Nếu cần update có thể thêm field ở đây
    },
    create: {
      userId: superGardenerUser.id,
      experiencePoints: 2000,
      experienceLevelId: level?.id ?? 6,
    },
  });

  console.log('✅ Seed Gardener cho user "supergardener" thành công.');
}
