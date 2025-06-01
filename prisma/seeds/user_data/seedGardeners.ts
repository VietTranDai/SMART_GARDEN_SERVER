import { PrismaClient } from '@prisma/client';

export async function seedGardeners(prisma: PrismaClient): Promise<void> {
  // Danh sách các gardener cần seed
  const gardenerUsers = [
    { username: 'supergardener', experiencePoints: 2000, levelId: 6 },
    { username: 'annguyen', experiencePoints: 500, levelId: 3 },
    { username: 'binhle', experiencePoints: 800, levelId: 4 },
    { username: 'minhpham', experiencePoints: 300, levelId: 2 },
  ];

  for (const gardenerData of gardenerUsers) {
    const user = await prisma.user.findUnique({
      where: { username: gardenerData.username },
    });

    if (!user) {
      throw new Error(
        `User "${gardenerData.username}" chưa được seed. Vui lòng chạy seedUsers trước.`,
      );
    }

    const level = await prisma.experienceLevel.findUnique({
      where: { level: gardenerData.levelId },
    });

    await prisma.gardener.upsert({
      where: { userId: user.id },
      update: {
        // Nếu cần update có thể thêm field ở đây
      },
      create: {
        userId: user.id,
        experiencePoints: gardenerData.experiencePoints,
        experienceLevelId: level?.id ?? gardenerData.levelId,
      },
    });

    console.log(`✅ Seed Gardener cho user "${gardenerData.username}" thành công.`);
  }
}
