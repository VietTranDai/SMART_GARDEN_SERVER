import { PrismaClient, SensorType, SensorUnit } from '@prisma/client';

export async function seedSensors(prisma: PrismaClient): Promise<void> {
  // Danh sách gardenKey được khai báo từ seedGardens
  const gardenKeys = ['1', '2', '3', '4', '5', '6', '7'];

  // Map từ SensorType sang SensorUnit
  const typeToUnit: Record<SensorType, SensorUnit> = {
    [SensorType.HUMIDITY]: SensorUnit.PERCENT,
    [SensorType.TEMPERATURE]: SensorUnit.CELSIUS,
    [SensorType.LIGHT]: SensorUnit.LUX,
    [SensorType.WATER_LEVEL]: SensorUnit.METER,
    [SensorType.RAINFALL]: SensorUnit.MILLIMETER,
    [SensorType.SOIL_MOISTURE]: SensorUnit.PERCENT,
    [SensorType.SOIL_PH]: SensorUnit.PH,
  };

  // Lấy tất cả các loại sensor từ enum SensorType
  const allSensorTypes = Object.values(SensorType) as SensorType[];

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
      const unit = typeToUnit[type];
      const sensorKey = `sensor_${gardenKey}_${type.toLowerCase()}`;
      const name = `${type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ')} Sensor`;

      await prisma.sensor.upsert({
        where: { sensorKey },
        update: {
          type,
          unit,
          name,
          gardenId: garden.id,
        },
        create: {
          sensorKey,
          type,
          unit,
          name,
          gardenId: garden.id,
        },
      });
    }
  }

  console.log(
    `✅ Đã seed sensors (có unit & name) cho các khu vườn với gardenKey: ${gardenKeys.join(', ')}.`
  );
}
