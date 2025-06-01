import { PrismaClient, GardenType, GardenStatus } from '@prisma/client';

export async function seedGardens(prisma: PrismaClient): Promise<void> {
  // Danh sách các gardener và garden tương ứng
  const gardenerGardens = [
    {
      username: 'supergardener',
      gardens: [
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
          plantStartDate: new Date('2025-04-15'),
          plantDuration: 100,
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
          plantStartDate: new Date('2025-05-05'),
          plantDuration: 100,
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
          plantName: 'Húng Quế',
          plantGrowStage: 'Phát triển',
          plantStartDate: new Date('2025-03-15'),
          plantDuration: 100,
        },
        {
          name: 'Vườn Cây Cà Chua',
          gardenKey: '4',
          profilePicture: '/pictures/gardens/ca-chua.png',
          description: 'Vườn cây cà chua tươi ngon, dễ chăm sóc.',
          street: '268 Lý Thường Kiệt',
          ward: 'Phường 14',
          district: 'Quận 10',
          city: 'TP.HCM',
          lat: 10.772141,
          lng: 106.65797,
          type: GardenType.OUTDOOR,
          status: GardenStatus.ACTIVE,
          plantName: 'Cây cà chua',
          plantGrowStage: 'Phát triển',
          plantStartDate: new Date('2025-03-15'),
          plantDuration: 100,
        },
      ],
    },
    {
      username: 'annguyen',
      gardens: [
        {
          name: 'Vườn Cà Chua Cherry',
          gardenKey: '5',
          profilePicture: '/pictures/gardens/ca-chua-cherry.png',
          description:
            'Vườn cà chua cherry ngọt ngào, hoàn hảo cho những bữa ăn gia đình.',
          street: '15 Nguyễn Văn Cừ',
          ward: 'Phường 2',
          district: 'Quận 5',
          city: 'TP.HCM',
          lat: 10.762622,
          lng: 106.681594,
          type: GardenType.OUTDOOR,
          status: GardenStatus.ACTIVE,
          plantName: 'Cà Chua Cherry',
          plantGrowStage: 'Ra hoa',
          plantStartDate: new Date('2025-03-20'),
          plantDuration: 120,
        },
      ],
    },
    {
      username: 'binhle',
      gardens: [
        {
          name: 'Vườn Hoa Hướng Dương',
          gardenKey: '6',
          profilePicture: '/pictures/gardens/huong-duong.png',
          description:
            'Vườn hoa hướng dương rực rỡ, mang lại năng lượng tích cực cho ngôi nhà.',
          street: '123 Điện Biên Phủ',
          ward: 'Phường 15',
          district: 'Bình Thạnh',
          city: 'TP.HCM',
          lat: 10.8012,
          lng: 106.7106,
          type: GardenType.BALCONY,
          status: GardenStatus.ACTIVE,
          plantName: 'Hoa Hướng Dương',
          plantGrowStage: 'Nảy mầm',
          plantStartDate: new Date('2025-05-01'),
          plantDuration: 90,
        },
      ],
    },
    {
      username: 'minhpham',
      gardens: [
        {
          name: 'Vườn Thảo Mộc',
          gardenKey: '7',
          profilePicture: '/pictures/gardens/thao-moc.png',
          description:
            'Vườn thảo mộc đa dạng với bạc hà, tía tô và nhiều loại cây thuốc nam.',
          street: '456 Cách Mạng Tháng 8',
          ward: 'Phường 10',
          district: 'Quận 3',
          city: 'TP.HCM',
          lat: 10.7769,
          lng: 106.6817,
          type: GardenType.INDOOR,
          status: GardenStatus.ACTIVE,
          plantName: 'Bạc Hà',
          plantGrowStage: 'Phát triển',
          plantStartDate: new Date('2025-04-10'),
          plantDuration: 80,
        },
      ],
    },
  ];

  let totalGardens = 0;

  for (const gardenerData of gardenerGardens) {
    const user = await prisma.user.findUnique({
      where: { username: gardenerData.username },
      include: { gardener: true },
    });

    if (!user?.gardener) {
      throw new Error(
        `User "${gardenerData.username}" hoặc thông tin gardener chưa được seed. Vui lòng chạy seedUsers và seedGardeners trước.`,
      );
    }

    for (const gardenData of gardenerData.gardens) {
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
          gardenerId: user.gardener.userId,
          type: gardenData.type,
          status: gardenData.status,
          plantName: gardenData.plantName,
          plantGrowStage: gardenData.plantGrowStage,
          plantStartDate: gardenData.plantStartDate,
          plantDuration: gardenData.plantDuration,
        },
      });
      totalGardens++;
    }

    console.log(
      `✅ Đã seed thành công ${gardenerData.gardens.length} khu vườn cho user "${gardenerData.username}".`,
    );
  }

  console.log(
    `🌱 Tổng cộng đã seed thành công ${totalGardens} khu vườn cho tất cả gardener.`,
  );
}
