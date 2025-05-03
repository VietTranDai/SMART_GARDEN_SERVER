import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedPlantTypes(prisma: PrismaClient): Promise<void> {
  const plantTypes = [
    {
      id: 1,
      name: 'Cây cảnh',
      description:
        'Cây trồng để trang trí, làm đẹp không gian và lọc không khí.',
    },
    {
      id: 2,
      name: 'Cây ăn quả',
      description: 'Cây trồng để thu hoạch quả ăn được, giàu dinh dưỡng.',
    },
    {
      id: 3,
      name: 'Cây ăn lá',
      description:
        'Cây trồng để thu hoạch lá làm thực phẩm, dùng trong bữa ăn hàng ngày.',
    },
    {
      id: 4,
      name: 'Cây gia vị',
      description:
        'Cây trồng để lấy lá hoặc thân làm gia vị, thảo dược, tăng hương vị món ăn.',
    },
  ];

  for (const pt of plantTypes) {
    await prisma.plantType.upsert({
      where: { id: pt.id },
      update: {},
      create: {
        id: pt.id,
        name: pt.name,
        description: pt.description,
      },
    });
  }

  console.log('✅ Seed PlantType thành công.');
}
