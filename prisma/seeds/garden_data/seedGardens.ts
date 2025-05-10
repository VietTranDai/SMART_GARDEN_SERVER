import { PrismaClient, GardenType, GardenStatus } from '@prisma/client';

export async function seedGardens(prisma: PrismaClient): Promise<void> {
  const superGardenerUser = await prisma.user.findUnique({
    where: { username: 'supergardener' },
    include: { gardener: true },
  });

  if (!superGardenerUser?.gardener) {
    throw new Error(
      'User "supergardener" hoặc thông tin gardener chưa được seed. Vui lòng chạy seedUsers và seedGardeners trước.',
    );
  }

  const gardens = [
    {
      name: 'Vườn Rau Sạch',
      gardenKey: '1',
      profilePicture: '/pictures/gardens/muong-rau.png',
      description:
        'Vườn rau hữu cơ không hóa chất, cung cấp rau tươi sạch mỗi ngày.',
      street: '268 Lý Thường Kiệt',
      ward: 'Phường 14',
      district: 'Quận 10',
      city: 'TP.HCM',
      lat: 10.772141,
      lng: 106.65797,
      type: GardenType.OUTDOOR,
      status: GardenStatus.ACTIVE,
      plantName: 'Rau Muống',
      plantGrowStage: 'Giai đoạn thu hoạch',
      plantStartDate: new Date('2023-10-15'),
      plantDuration: 30,
    },
    {
      name: 'Vườn Hoa Ban Công',
      gardenKey: '2',
      profilePicture: '/pictures/gardens/rose-ban.png',
      description:
        'Ban công rực rỡ hoa Cây Lan ý, tạo không gian thơ mộng và dễ chăm sóc.',
      street: '268 Lý Thường Kiệt',
      ward: 'Đông Hòa',
      district: 'Dĩ An',
      city: 'Bình Dương',
      lat: 10.8946458,
      lng: 106.7811372,
      type: GardenType.BALCONY,
      status: GardenStatus.ACTIVE,
      plantName: 'Cây Lan ý',
      plantGrowStage: 'Nhân giống',
      plantStartDate: new Date('2023-11-20'),
      plantDuration: 90,
    },
    {
      name: 'Vườn Gia Vị Trong Nhà',
      gardenKey: '3',
      profilePicture: '/pictures/gardens/hung-que.png',
      description:
        'Vườn gia vị trong nhà với húng quế thơm, giúp tăng hương vị món ăn.',
      street: '268 Lý Thường Kiệt',
      ward: 'Phường 14',
      district: 'Quận 10',
      city: 'TP.HCM',
      lat: 10.772141,
      lng: 106.65797,
      type: GardenType.OUTDOOR,
      status: GardenStatus.ACTIVE,
      plantName: 'Sinh trưởng',
      plantGrowStage: 'Phát triển',
      plantStartDate: new Date('2023-12-05'),
      plantDuration: 45,
    },
  ];

  for (const gardenData of gardens) {
    await prisma.garden.upsert({
      where: { gardenKey: gardenData.gardenKey },
      update: {
        name: gardenData.name,
        status: gardenData.status,
        description: gardenData.description,
      },
      create: {
        gardenKey: gardenData.gardenKey,
        name: gardenData.name,
        description: gardenData.description,
        profilePicture: gardenData.profilePicture,
        street: gardenData.street,
        ward: gardenData.ward,
        district: gardenData.district,
        city: gardenData.city,
        lat: gardenData.lat,
        lng: gardenData.lng,
        gardenerId: superGardenerUser.gardener.userId,
        type: gardenData.type,
        status: gardenData.status,
        plantName: gardenData.plantName,
        plantGrowStage: gardenData.plantGrowStage,
        plantStartDate: gardenData.plantStartDate,
        plantDuration: gardenData.plantDuration,
      },
    });
  }

  console.log(
    `✅ Đã seed thành công ${gardens.length} khu vườn cho user "supergardener".`,
  );
}
