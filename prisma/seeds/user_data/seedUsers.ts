// prisma/seedUsers.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export async function seedUsers(prisma: PrismaClient): Promise<void> {
  // 1) Lấy role ID
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  const gardenerRole = await prisma.role.findUnique({
    where: { name: 'GARDENER' },
  });

  if (!adminRole || !gardenerRole) {
    throw new Error(
      'Roles ADMIN hoặc GARDENER chưa được seed. Vui lòng chạy seedRoles trước.',
    );
  }

  // 2) Hash password chung
  const defaultPassword = '123456';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // 3) Định nghĩa users cần tạo
  const users = [
    {
      firstName: 'Alice',
      lastName: 'Admin',
      email: 'alice.admin@example.com',
      username: 'admin1',
      password: hashedPassword,
      roleId: adminRole.id,
      phoneNumber: '0123456789',
    },
    {
      firstName: 'Bob',
      lastName: 'Admin',
      email: 'bob.admin@example.com',
      username: 'admin2',
      password: hashedPassword,
      roleId: adminRole.id,
      phoneNumber: '0987654321',
    },
    {
      firstName: 'Carol',
      lastName: 'Gardener',
      email: 'carol.gardener@example.com',
      username: 'gardener1',
      password: hashedPassword,
      roleId: gardenerRole.id,
      phoneNumber: '0912345678',
    },
    {
      firstName: 'Dave',
      lastName: 'Gardener',
      email: 'dave.gardener@example.com',
      username: 'gardener2',
      password: hashedPassword,
      roleId: gardenerRole.id,
      phoneNumber: '0898765432',
    },
  ];

  // 4) Upsert từng record để tránh trùng lặp
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
  }

  console.log(
    '✅ Seed Users (2 ADMIN + 2 GARDENER) với username admin1, admin2, gardener1, gardener2 thành công.',
  );
}
