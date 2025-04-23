import { PrismaClient } from '@prisma/client';

export async function seedRoles(prisma: PrismaClient): Promise<void> {
  const roles = [
    { name: 'ADMIN', description: 'Administrator role with full access' },
    {
      name: 'GARDENER',
      description: 'Gardener role for managing plant care',
    },
    { name: 'SUPPORT', description: 'Support role for customer assistance' },
    {
      name: 'MANAGER',
      description: 'Manager role with oversight responsibilities',
    },
  ];

  for (const role of roles) {
    // Dùng upsert để tránh trùng lặp nếu đã seed trước đó
    await prisma.role.upsert({
      where: { name: role.name },
      update: {}, // Nếu đã tồn tại, không cần cập nhật gì
      create: role, // Nếu chưa có, tạo mới record
    });
  }

  console.log('✅ Seed Roles thành công.');
}
