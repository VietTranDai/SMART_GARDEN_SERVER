import { PrismaClient } from '@prisma/client';

export async function seedExperienceLevels(prisma: PrismaClient) {
  console.log('⛏️ Seed kinh nghiệm làm vườn...');

  const experienceLevels = [
    {
      level: 1,
      minXP: 0,
      maxXP: 99,
      title: 'Người làm vườn mới bắt đầu',
      description: 'Mới bắt đầu hành trình làm vườn',
      icon: '🌱',
    },
    {
      level: 2,
      minXP: 100,
      maxXP: 299,
      title: 'Người làm vườn sơ cấp',
      description: 'Gieo trồng những cây đầu tiên thành công',
      icon: '🌿',
    },
    {
      level: 3,
      minXP: 300,
      maxXP: 599,
      title: 'Người làm vườn thành thạo',
      description: 'Phát triển kỹ năng làm vườn ổn định',
      icon: '🍀',
    },
    {
      level: 4,
      minXP: 600,
      maxXP: 999,
      title: 'Người làm vườn khéo léo',
      description: 'Thành thạo nhiều kỹ thuật làm vườn',
      icon: '🌳',
    },
    {
      level: 5,
      minXP: 1000,
      maxXP: 1499,
      title: 'Chuyên gia làm vườn',
      description: 'Thành thạo trồng đa dạng loại cây',
      icon: '🌲',
    },
    {
      level: 6,
      minXP: 1500,
      maxXP: 2099,
      title: 'Bậc thầy làm vườn',
      description: 'Bậc thầy thiết kế vườn và chăm sóc cây',
      icon: '🌴',
    },
    {
      level: 7,
      minXP: 2100,
      maxXP: 2999,
      title: 'Nghệ sĩ làm vườn',
      description: 'Kỹ năng và kiến thức làm vườn xuất sắc',
      icon: '🏡',
    },
    {
      level: 8,
      minXP: 3000,
      maxXP: 4999,
      title: 'Bậc thầy khu vườn',
      description: 'Khả năng quản lý vườn phi thường',
      icon: '🌺',
    },
    {
      level: 9,
      minXP: 5000,
      maxXP: 7999,
      title: 'Huyền thoại làm vườn',
      description: 'Tài năng và tầm ảnh hưởng làm vườn huyền thoại',
      icon: '👑',
    },
    {
      level: 10,
      minXP: 8000,
      maxXP: 999_999,
      title: 'Đại cao thủ làm vườn',
      description: 'Đỉnh cao của nghệ thuật làm vườn',
      icon: '🏆',
    },
  ];

  for (const lvl of experienceLevels) {
    await prisma.experienceLevel.upsert({
      where: { level: lvl.level },
      update: lvl,
      create: lvl,
    });
  }

  console.log(`✅ Đã seed ${experienceLevels.length} cấp độ kinh nghiệm.`);
}
