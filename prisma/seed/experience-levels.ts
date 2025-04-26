import { PrismaClient } from '@prisma/client';

export async function seedExperienceLevels(prisma: PrismaClient) {
  console.log('Seeding experience levels...');

  // Define the experience levels
  const experienceLevels = [
    {
      level: 1,
      minXP: 0,
      maxXP: 99,
      title: 'Beginner Gardener',
      description: 'Just starting your gardening journey',
      icon: '🌱',
    },
    {
      level: 2,
      minXP: 100,
      maxXP: 299,
      title: 'Novice Gardener',
      description: 'Growing your first plants successfully',
      icon: '🌿',
    },
    {
      level: 3,
      minXP: 300,
      maxXP: 599,
      title: 'Capable Gardener',
      description: 'Developing consistent gardening skills',
      icon: '🍀',
    },
    {
      level: 4,
      minXP: 600,
      maxXP: 999,
      title: 'Skilled Gardener',
      description: 'Mastering various gardening techniques',
      icon: '🌳',
    },
    {
      level: 5,
      minXP: 1000,
      maxXP: 1499,
      title: 'Expert Gardener',
      description: 'Expert in growing diverse plant varieties',
      icon: '🌲',
    },
    {
      level: 6,
      minXP: 1500,
      maxXP: 2099,
      title: 'Master Gardener',
      description: 'Master of garden design and plant care',
      icon: '🌴',
    },
    {
      level: 7,
      minXP: 2100,
      maxXP: 2999,
      title: 'Garden Virtuoso',
      description: 'Exceptional gardening skills and knowledge',
      icon: '🏡',
    },
    {
      level: 8,
      minXP: 3000,
      maxXP: 4999,
      title: 'Garden Maestro',
      description: 'Extraordinary garden management abilities',
      icon: '🌺',
    },
    {
      level: 9,
      minXP: 5000,
      maxXP: 7999,
      title: 'Garden Legend',
      description: 'Legendary gardening prowess and influence',
      icon: '👑',
    },
    {
      level: 10,
      minXP: 8000,
      maxXP: 999999,
      title: 'Garden Grandmaster',
      description: 'The pinnacle of gardening excellence',
      icon: '🏆',
    },
  ];

  // Insert or update the experience levels
  for (const level of experienceLevels) {
    await prisma.experienceLevel.upsert({
      where: { level: level.level },
      update: level,
      create: level,
    });
  }

  console.log(`Seeded ${experienceLevels.length} experience levels`);
}
