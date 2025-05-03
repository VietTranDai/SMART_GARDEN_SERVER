import { PrismaClient } from '@prisma/client';

export async function seedRoles(prisma: PrismaClient): Promise<void> {
  const roles = [
    {
      name: 'ADMIN',
      description: 'Vai trò Quản trị viên với quyền truy cập đầy đủ',
    },
    {
      name: 'GARDENER',
      description: 'Vai trò Người làm vườn để quản lý chăm sóc cây trồng',
    },
    { name: 'SUPPORT', description: 'Vai trò Hỗ trợ chăm sóc khách hàng' },
    {
      name: 'MANAGER',
      description: 'Vai trò Quản lý với trách nhiệm giám sát',
    },
  ];

  for (const role of roles) {
    // Dùng upsert để tránh trùng lặp nếu đã seed trước đó
    await prisma.role.upsert({
      where: { name: role.name },
      update: {}, // Nếu đã tồn tại, giữ nguyên
      create: role, // Nếu chưa có, tạo mới bản ghi
    });
  }

  console.log('✅ Seed Roles thành công.');
}
