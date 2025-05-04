import { PrismaClient, SensorType } from '@prisma/client';

export async function seedSensors(prisma: PrismaClient): Promise<void> {
  // Danh sách gardenKey được khai báo từ seedGardens
  const gardenKeys = ['1', '2', '3'];

  // Lấy tất cả các loại sensor từ enum SensorType
  const allSensorTypes = Object.values(SensorType);

  for (const gardenKey of gardenKeys) {
    // Tìm gardenId tương ứng với gardenKey
    const garden = await prisma.garden.findUnique({
      where: { gardenKey },
    });

    if (!garden) {
      console.error(`Không tìm thấy khu vườn với gardenKey: ${gardenKey}`);
      continue;
    }

    for (const type of allSensorTypes) {
      // Tạo sensorKey theo định dạng: sensor_gardenKey_type
      const sensorKey = `sensor_${gardenKey}_${type.toLowerCase()}`;

      await prisma.sensor.upsert({
        where: { sensorKey },
        update: {
          type,
          gardenId: garden.id,
        },
        create: {
          sensorKey,
          type,
          gardenId: garden.id,
        },
      });
    }
  }

  console.log(`✅ Đã seed sensors cho các khu vườn với gardenKey: ${gardenKeys.join(', ')}.`);
}