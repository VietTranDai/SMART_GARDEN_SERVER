// prisma/seedUsers.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export async function seedUsers(prisma: PrismaClient): Promise<void> {
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  const gardenerRole = await prisma.role.findUnique({
    where: { name: 'GARDENER' },
  });

  if (!adminRole || !gardenerRole) {
    throw new Error(
      'Roles ADMIN hoặc GARDENER chưa được seed. Vui lòng chạy seedRoles trước.',
    );
  }

  const defaultPassword = '123456';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const users = [
    {
      firstName: 'Tran Dai',
      lastName: 'Viet',
      profilePicture: '/pictures/avatars/user-1-20250501T081035Z.png',
      email: 'viet.trankhmtbk22@hcmut.edu.vn',
      username: 'superadmin',
      password: hashedPassword,
      roleId: adminRole.id,
      phoneNumber: '0383525377',
    },
    {
      firstName: 'Tran Dai',
      lastName: 'Viet',
      profilePicture: '/pictures/avatars/user-2-20250501T081035Z.png',
      email: 'viet.trankhmtbk22@hcmut.edu.vn',
      username: 'supergardener',
      password: hashedPassword,
      roleId: gardenerRole.id,
      phoneNumber: '0383525377',
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: u,
    });
  }

  console.log(
    '✅ Seed Users thành công.',
  );
}
