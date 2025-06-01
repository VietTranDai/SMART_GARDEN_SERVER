import { PrismaClient, ActivityType, EvaluatorType } from '@prisma/client';

export async function seedGardenActivities(prisma: PrismaClient): Promise<void> {
  // Lấy thông tin supergardener và các garden của họ
  const superGardener = await prisma.user.findUnique({
    where: { username: 'supergardener' },
    include: { 
      gardener: {
        include: {
          gardens: true
        }
      }
    },
  });

  if (!superGardener?.gardener) {
    throw new Error('User "supergardener" hoặc thông tin gardener chưa được seed.');
  }
  const gardens = superGardener.gardener.gardens;
  if (gardens.length === 0) {
    throw new Error('Supergardener chưa có garden nào được seed.');
  }

  // Dữ liệu hoạt động theo từng garden - mở rộng và chi tiết hóa
  const gardenActivities = [
    // Garden 1: Vườn Rau Sạch (Rau Muống) - Mở rộng thêm nhiều hoạt động
    {
      gardenId: gardens.find(g => g.gardenKey === '1')?.id,
      activities: [
        // Tháng 4
        {
          name: 'Chuẩn bị đất trồng rau muống',
          activityType: ActivityType.SOIL_TESTING,
          timestamp: new Date('2025-04-10T07:00:00Z'),
          plantName: 'Rau Muống',
          plantGrowStage: 'Chuẩn bị đất',
          humidity: 72.0,
          temperature: 27.5,
          soilPH: 6.5,
          soilMoisture: 35.0,
          details: 'Xới đất sâu 25cm, trộn phân chuồng hoai mục với tỷ lệ 1:3. Kiểm tra pH đất bằng giấy quỳ tím.',
          reason: 'Rau muống cần đất tơi xốp, giàu chất hữu cơ và pH từ 6.0-7.0',
          notes: 'Đất có màu nâu đậm, mùi thơm của phân chuồng. Độ ẩm vừa phải, không bị úng nước.',
        },
        {
          name: 'Gieo hạt rau muống',
          activityType: ActivityType.PLANTING,
          timestamp: new Date('2025-04-15T06:30:00Z'),
          plantName: 'Rau Muống',
          plantGrowStage: 'Gieo hạt',
          humidity: 78.0,
          temperature: 26.0,
          lightIntensity: 800.0,
          soilMoisture: 55.0,
          details: 'Gieo 200g hạt rau muống giống Việt Nam trên luống rộng 1.2m, dài 5m. Khoảng cách hàng 15cm.',
          reason: 'Thời điểm tốt nhất để gieo rau muống tại miền Nam, tránh mùa mưa',
          notes: 'Hạt giống mua tại cửa hàng uy tín, tỷ lệ nảy mầm 95%. Che lưới chắn nắng 50% trong 3 ngày đầu.',
        },
        {
          name: 'Tưới nước lần đầu sau gieo',
          activityType: ActivityType.WATERING,
          timestamp: new Date('2025-04-15T17:00:00Z'),
          plantName: 'Rau Muống',
          plantGrowStage: 'Vừa gieo hạt',
          humidity: 75.0,
          temperature: 29.0,
          soilMoisture: 60.0,
          details: 'Tưới bằng vòi phun sương nhẹ, 3 lít nước cho cả luống. Tránh làm trôi hạt.',
          reason: 'Duy trì độ ẩm cho hạt nảy mầm, tưới nhẹ để không làm hạt bị sâu',
          notes: 'Nước tưới đã để qua đêm, nhiệt độ phòng. Đất thấm đều, không bị đọng nước.',
        },
        {
          name: 'Kiểm tra nảy mầm',
          activityType: ActivityType.OTHER,
          timestamp: new Date('2025-04-18T06:00:00Z'),
          plantName: 'Rau Muống',
          plantGrowStage: 'Nảy mầm',
          humidity: 80.0,
          temperature: 25.5,
          lightIntensity: 600.0,
          details: 'Khoảng 85% hạt đã nảy mầm. Mầm cao 1-2cm, có 2 lá mầm xanh tươi.',
          reason: 'Theo dõi tỷ lệ nảy mầm để đánh giá chất lượng giống và kỹ thuật gieo',
          notes: 'Một số chỗ thưa cần gieo bổ sung. Mầm phát triển đồng đều, màu xanh khỏe mạnh.',
        },
        {
          name: 'Bón phân lót',
          activityType: ActivityType.FERTILIZING,
          timestamp: new Date('2025-04-22T16:30:00Z'),
          plantName: 'Rau Muống',
          plantGrowStage: 'Cây con 5-7cm',
          soilPH: 6.6,
          soilMoisture: 45.0,
          temperature: 28.0,
          details: 'Bón 500g phân NPK 16-16-8 pha loãng theo tỷ lệ 1:100. Bón cách gốc 5cm.',
          reason: 'Cây con cần dinh dưỡng để phát triển hệ rễ và lá. NPK cân bằng giúp cây khỏe mạnh.',
          notes: 'Bón vào buổi chiều mát để tránh cháy lá. Tưới nhẹ sau khi bón để phân thấm vào đất.',
        },
        {
          name: 'Tỉa thưa và nhổ cỏ',
          activityType: ActivityType.WEEDING,
          timestamp: new Date('2025-04-25T07:00:00Z'),
          plantName: 'Rau Muống',
          plantGrowStage: 'Cây con 8-10cm',
          details: 'Tỉa thưa cây con, giữ khoảng cách 8-10cm. Nhổ cỏ dại như cỏ kê, cỏ mần trầu.',
          reason: 'Tạo không gian cho cây phát triển tốt, loại bỏ cạnh tranh dinh dưỡng từ cỏ dại',
          notes: 'Cây con phát triển tốt, rễ bám chắc vào đất. Cỏ dại chủ yếu mọc ở lối đi.',
        },
        
        // Tháng 5 - Giai đoạn phát triển
        {
          name: 'Tưới nước buổi sáng',
          activityType: ActivityType.WATERING,
          timestamp: new Date('2025-05-01T06:30:00Z'),
          plantName: 'Rau Muống',
          plantGrowStage: 'Phát triển mạnh',
          humidity: 75.0,
          temperature: 28.5,
          lightIntensity: 1200.0,
          soilMoisture: 45.0,
          waterLevel: 15.0,
          details: 'Tưới 8 lít nước cho luống rau muống. Sử dụng ống nhựa đục lỗ để tưới đều.',
          reason: 'Duy trì độ ẩm đất trong giai đoạn cây lớn. Tưới sáng để cây hấp thụ tốt.',
          notes: 'Lá rau muống xanh đậm, thân cây to khỏe. Một số cây đã cao 25-30cm.',
        },
        {
          name: 'Bón phân thúc đẩy lá',
          activityType: ActivityType.FERTILIZING,
          timestamp: new Date('2025-05-05T17:00:00Z'),
          plantName: 'Rau Muống',
          plantGrowStage: 'Phát triển lá',
          soilPH: 6.7,
          soilMoisture: 50.0,
          temperature: 27.0,
          details: 'Bón phân urê 1% (10g/1 lít nước) để thúc đẩy phát triển lá. Bón gốc và phun lá.',
          reason: 'Rau muống cần nhiều đạm để phát triển lá xanh, mật độ lá cao',
          notes: 'Bón vào buổi chiều mát. Sau 3 ngày thấy lá xanh hơn rõ rệt.',
        },
        {
          name: 'Kiểm soát sâu xanh',
          activityType: ActivityType.PEST_CONTROL,
          timestamp: new Date('2025-05-10T08:00:00Z'),
          plantName: 'Rau Muống',
          plantGrowStage: 'Phát triển',
          humidity: 70.0,
          temperature: 26.5,
          details: 'Phát hiện một ít sâu xanh trên lá. Phun thuốc BT (Bacillus thuringiensis) 0.5%.',
          reason: 'Sâu xanh có thể phá hoại lá non, cần xử lý sớm để bảo vệ năng suất',
          notes: 'Chỉ có khoảng 5% cây bị sâu. Sử dụng thuốc sinh học an toàn cho sức khỏe.',
        },
        {
          name: 'Thu hoạch lứa đầu',
          activityType: ActivityType.HARVESTING,
          timestamp: new Date('2025-05-15T06:00:00Z'),
          plantName: 'Rau Muống',
          plantGrowStage: 'Thu hoạch lứa 1',
          humidity: 70.0,
          temperature: 26.0,
          details: 'Thu hoạch 3.2kg rau muống tươi. Cắt cách gốc 3cm để cây tái sinh.',
          reason: 'Cây cao 35-40cm, lá đã già cần thu hoạch kịp thời để đảm bảo chất lượng',
          notes: 'Chất lượng rau rất tốt, lá xanh đậm, giòn và ngọt. Khách hàng rất hài lòng.',
        },
        {
          name: 'Bón phân sau thu hoạch',
          activityType: ActivityType.FERTILIZING,
          timestamp: new Date('2025-05-16T16:00:00Z'),
          plantName: 'Rau Muống',
          plantGrowStage: 'Tái sinh sau thu hoạch',
          soilPH: 6.8,
          soilMoisture: 40.0,
          details: 'Bón 1.5kg phân chuồng ủ hoai + 200g NPK 20-20-15 cho luống rau.',
          reason: 'Bổ sung dinh dưỡng sau thu hoạch để cây tái sinh nhanh và khỏe mạnh',
          notes: 'Trộn đều phân vào đất xung quanh gốc cây. Tưới nhẹ để phân hòa tan.',
        },

        // Tháng 5-6 - Lứa thứ 2
        {
          name: 'Theo dõi tái sinh',
          activityType: ActivityType.OTHER,
          timestamp: new Date('2025-05-20T07:30:00Z'),
          plantName: 'Rau Muống',
          plantGrowStage: 'Tái sinh',
          humidity: 78.0,
          temperature: 27.0,
          lightIntensity: 1100.0,
          details: 'Cây tái sinh tốt, đã có chồi non cao 5-8cm. Một số gốc ra 3-4 chồi.',
          reason: 'Theo dõi quá trình tái sinh để đánh giá hiệu quả bón phân',
          notes: 'Tốc độ tái sinh nhanh hơn dự kiến. Chồi non màu xanh tươi, sinh trưởng mạnh.',
        },
        {
          name: 'Tưới nước đều đặn',
          activityType: ActivityType.WATERING,
          timestamp: new Date('2025-05-25T06:30:00Z'),
          plantName: 'Rau Muống',
          plantGrowStage: 'Giai đoạn thu hoạch lứa 2',
          humidity: 75.0,
          temperature: 28.5,
          lightIntensity: 1200.0,
          soilMoisture: 45.0,
          details: 'Tưới 7 lít nước cho luống. Điều chỉnh lượng nước theo độ ẩm đất.',
          reason: 'Duy trì độ ẩm ổn định cho cây phát triển đều, chuẩn bị thu hoạch lứa 2',
          notes: 'Lá rau muống xanh tốt, sẵn sàng thu hoạch trong vài ngày tới. Chất lượng ổn định.',
        },
        {
          name: 'Thu hoạch lứa thứ hai',
          activityType: ActivityType.HARVESTING,
          timestamp: new Date('2025-05-28T07:00:00Z'),
          plantName: 'Rau Muống',
          plantGrowStage: 'Thu hoạch lứa 2',
          humidity: 70.0,
          temperature: 26.0,
          details: 'Thu hoạch được 2.8kg rau muống tươi. Năng suất giảm nhẹ so với lứa đầu.',
          reason: 'Rau muống lứa 2 đã đạt độ tuổi thu hoạch tối ưu (20-25 ngày sau lứa 1)',
          notes: 'Chất lượng vẫn tốt nhưng lá hơi nhỏ hơn lứa đầu. Cây vẫn còn sức sống tốt.',
        },
        {
          name: 'Bón phân phục hồi',
          activityType: ActivityType.FERTILIZING,
          timestamp: new Date('2025-05-30T16:00:00Z'),
          plantName: 'Rau Muống',
          plantGrowStage: 'Tái sinh sau thu hoạch lứa 2',
          soilPH: 6.8,
          soilMoisture: 40.0,
          details: 'Bón 1kg phân chuồng ủ hoai + 150g NPK để chuẩn bị cho lứa thứ 3.',
          reason: 'Bổ sung dinh dưỡng sau 2 lứa thu hoạch, đất đã cạn kiệt chất dinh dưỡng',
          notes: 'Cần tăng cường phân hữu cơ để cải thiện cấu trúc đất và giữ ẩm tốt hơn.',
        },
      ],
    },

    // Garden 2: Vườn Hoa Ban Công (Cây Lan ý) - Mở rộng chi tiết
    {
      gardenId: gardens.find(g => g.gardenKey === '2')?.id,
      activities: [
        // Tháng 4-5
        {
          name: 'Chuẩn bị đất trồng lan ý',
          activityType: ActivityType.SOIL_TESTING,
          timestamp: new Date('2025-04-20T14:00:00Z'),
          plantName: 'Cây Lan ý',
          plantGrowStage: 'Chuẩn bị trồng',
          humidity: 75.0,
          temperature: 25.0,
          soilPH: 6.5,
          soilMoisture: 30.0,
          details: 'Pha trộn đất: 40% đất vườn + 30% xơ dừa + 20% phân chuồng + 10% perlite. Kiểm tra thoát nước.',
          reason: 'Lan ý cần đất thoát nước tốt, tơi xốp và giàu chất hữu cơ',
          notes: 'Đất có màu nâu sậm, tơi xốp. Test thoát nước: nước thấm hết trong 15 phút.',
        },
        {
          name: 'Chọn và chuẩn bị cành giâm',
          activityType: ActivityType.PLANTING,
          timestamp: new Date('2025-05-01T09:00:00Z'),
          plantName: 'Cây Lan ý',
          plantGrowStage: 'Chuẩn bị nhân giống',
          humidity: 80.0,
          temperature: 24.0,
          lightIntensity: 600.0,
          details: 'Chọn 8 cành khỏe mạnh, dài 15-20cm, có 4-5 đốt lá. Cắt xiên 45 độ dưới nước.',
          reason: 'Chọn cành non, còn xanh tươi để tỷ lệ ra rễ cao. Cắt xiên tăng diện tích hấp thụ.',
          notes: 'Cành được chọn từ cây mẹ 2 tuổi, sinh trưởng tốt. Ngâm hormone kích rễ IBA 1000ppm 30 phút.',
        },
        {
          name: 'Giâm cành trong chậu',
          activityType: ActivityType.PLANTING,
          timestamp: new Date('2025-05-02T15:30:00Z'),
          plantName: 'Cây Lan ý',
          plantGrowStage: 'Nhân giống',
          humidity: 85.0,
          temperature: 23.0,
          soilMoisture: 70.0,
          details: 'Giâm 8 cành vào chậu nhựa 15cm. Độ sâu 1/3 chiều dài cành. Che lưới 70%.',
          reason: 'Tạo môi trường ẩm, tránh ánh sáng trực tiếp để cành ra rễ nhanh',
          notes: 'Đặt chậu nơi thoáng mát, tránh gió. Phun sương 2 lần/ngày để duy trì độ ẩm.',
        },
        {
          name: 'Theo dõi quá trình ra rễ',
          activityType: ActivityType.OTHER,
          timestamp: new Date('2025-05-10T08:00:00Z'),
          plantName: 'Cây Lan ý',
          plantGrowStage: 'Ra rễ',
          humidity: 82.0,
          temperature: 24.5,
          details: '6/8 cành đã có rễ non dài 0.5-1cm. Rễ màu trắng, khỏe mạnh.',
          reason: 'Kiểm tra tiến độ ra rễ để điều chỉnh chế độ chăm sóc phù hợp',
          notes: '2 cành chưa ra rễ có dấu hiệu héo. Tăng cường phun sương cho nhóm này.',
        },
        {
          name: 'Bón phân lót nhẹ',
          activityType: ActivityType.FERTILIZING,
          timestamp: new Date('2025-05-15T17:00:00Z'),
          plantName: 'Cây Lan ý',
          plantGrowStage: 'Cây con có rễ',
          soilPH: 6.6,
          soilMoisture: 60.0,
          temperature: 25.0,
          details: 'Pha phân NPK 15-15-15 nồng độ 0.5% (5g/1L). Tưới gốc nhẹ 50ml/cây.',
          reason: 'Bổ sung dinh dưỡng nhẹ cho cây con phát triển rễ và lá mới',
          notes: 'Bón nhẹ tay để tránh cháy rễ non. Cây phản ứng tích cực sau 5 ngày.',
        },
        {
          name: 'Tưới phun sương đều đặn',
          activityType: ActivityType.WATERING,
          timestamp: new Date('2025-05-20T07:00:00Z'),
          plantName: 'Cây Lan ý',
          plantGrowStage: 'Phát triển ổn định',
          humidity: 80.0,
          temperature: 26.0,
          soilMoisture: 65.0,
          details: 'Phun sương 3 lần/ngày: 7h, 14h, 18h. Mỗi lần phun 2-3 giây/chậu.',
          reason: 'Duy trì độ ẩm cao giúp cây thích nghi môi trường mới, lá không bị héo',
          notes: 'Lá cây bắt đầu có màu xanh đậm hơn. Một số cây có dấu hiệu đâm chồi mới.',
        },
        {
          name: 'Tỉa lá già và lá vàng',
          activityType: ActivityType.PRUNING,
          timestamp: new Date('2025-05-25T09:30:00Z'),
          plantName: 'Cây Lan ý',
          plantGrowStage: 'Phát triển',
          details: 'Cắt bỏ 5-6 lá vàng và héo ở phần dưới thân. Giữ lại 6-8 lá khỏe mạnh/cây.',
          reason: 'Loại bỏ lá bệnh, tập trung dinh dưỡng cho lá non và rễ đang phát triển',
          notes: 'Sử dụng kéo sạch, cắt sát gốc lá. Cây phát triển đều, lá non xanh bóng.',
        },
        {
          name: 'Kiểm tra sâu bệnh',
          activityType: ActivityType.PEST_CONTROL,
          timestamp: new Date('2025-05-28T16:00:00Z'),
          plantName: 'Cây Lan ý',
          plantGrowStage: 'Ổn định',
          humidity: 78.0,
          temperature: 27.0,
          details: 'Không phát hiện sâu bệnh. Phun dung dịch lá neem 0.5% để phòng ngừa.',
          reason: 'Phòng ngừa rệp, nhện đỏ và các loại nấm thường gặp ở cây cảnh',
          notes: 'Cây khỏe mạnh, không có dấu hiệu bệnh tật. Lá xanh tươi, bóng đẹp.',
        },
        {
          name: 'Chuyển chậu lớn hơn',
          activityType: ActivityType.OTHER,
          timestamp: new Date('2025-05-30T10:00:00Z'),
          plantName: 'Cây Lan ý',
          plantGrowStage: 'Cần không gian phát triển',
          details: 'Chuyển 6 cây khỏe mạnh sang chậu 20cm. Bổ sung đất mới và phân chuồng.',
          reason: 'Rễ cây đã đầy chậu, cần không gian lớn hơn để phát triển tốt',
          notes: 'Rễ phát triển tốt, màu trắng khỏe mạnh. 2 cây còn lại để quan sát thêm.',
        },
      ],
    },

    // Garden 3: Vườn Gia Vị Trong Nhà (Húng Quế) - Mở rộng hoạt động
    {
      gardenId: gardens.find(g => g.gardenKey === '3')?.id,
      activities: [
        // Tháng 3-4
        {
          name: 'Gieo hạt húng quế',
          activityType: ActivityType.PLANTING,
          timestamp: new Date('2025-03-15T08:00:00Z'),
          plantName: 'Húng Quế',
          plantGrowStage: 'Gieo hạt',
          humidity: 70.0,
          temperature: 24.0,
          lightIntensity: 800.0,
          soilMoisture: 60.0,
          details: 'Gieo 50 hạt húng quế giống Ý vào khay ươm 72 ô. Phủ mỏng đất rồi phun ẩm.',
          reason: 'Tạo nguồn cây giống húng quế sạch cho gia đình, đảm bảo chất lượng từ hạt',
          notes: 'Hạt giống nhập từ Ý, tỷ lệ nảy mầm 90%. Đặt khay ở nơi ấm áp, tránh ánh sáng trực tiếp.',
        },
        {
          name: 'Chăm sóc cây con',
          activityType: ActivityType.WATERING,
          timestamp: new Date('2025-03-25T07:30:00Z'),
          plantName: 'Húng Quế',
          plantGrowStage: 'Cây con 2-3 lá',
          humidity: 75.0,
          temperature: 23.0,
          soilMoisture: 55.0,
          details: 'Tưới nhẹ bằng bình phun, 2 lần/ngày. Giữ đất ẩm nhưng không úng nước.',
          reason: 'Cây con húng quế nhạy cảm với độ ẩm, cần tưới đều đặn nhưng tránh úng',
          notes: '42/50 cây nảy mầm tốt. Lá mầm xanh tươi, thân cây chắc khỏe.',
        },
        {
          name: 'Chuyển chậu riêng',
          activityType: ActivityType.PLANTING,
          timestamp: new Date('2025-04-05T14:00:00Z'),
          plantName: 'Húng Quế',
          plantGrowStage: 'Cây con 4-5 lá',
          soilPH: 6.8,
          soilMoisture: 50.0,
          details: 'Chuyển 30 cây con khỏe nhất vào chậu 12cm. Đất trộn: 50% đất vườn + 30% xơ dừa + 20% phân chuồng.',
          reason: 'Cây con đã đủ lớn để chuyển chậu riêng, tránh cạnh tranh dinh dưỡng',
          notes: 'Rễ cây phát triển tốt, màu trắng. Thao tác nhẹ nhàng để không làm tổn thương rễ.',
        },
        {
          name: 'Bón phân lần đầu',
          activityType: ActivityType.FERTILIZING,
          timestamp: new Date('2025-04-15T16:30:00Z'),
          plantName: 'Húng Quế',
          plantGrowStage: 'Cây con ổn định',
          soilPH: 6.9,
          soilMoisture: 48.0,
          temperature: 25.0,
          details: 'Bón phân hữu cơ lỏng pha loãng 1:20. Mỗi cây 30ml, tưới gốc nhẹ nhàng.',
          reason: 'Bổ sung dinh dưỡng ban đầu giúp cây con phát triển mạnh hệ rễ và lá',
          notes: 'Sử dụng phân hữu cơ để đảm bảo an toàn cho gia vị ăn tươi.',
        },

        // Tháng 4-5: Giai đoạn phát triển
        {
          name: 'Tỉa ngọn lần đầu',
          activityType: ActivityType.PRUNING,
          timestamp: new Date('2025-04-25T09:00:00Z'),
          plantName: 'Húng Quế',
          plantGrowStage: 'Cao 15-20cm',
          details: 'Tỉa ngọn khi cây cao 20cm, cắt bỏ 3-4cm đầu ngọn để kích thích phân cành.',
          reason: 'Tỉa ngọn giúp cây đâm chồi nách, tăng số lượng cành và lá thu hoạch',
          notes: 'Ngọn cắt có thể dùng làm gia vị tươi. Cây phản ứng tốt, ra chồi nách sau 1 tuần.',
        },
        {
          name: 'Kiểm soát rệp muỗi',
          activityType: ActivityType.PEST_CONTROL,
          timestamp: new Date('2025-05-01T08:30:00Z'),
          plantName: 'Húng Quế',
          plantGrowStage: 'Phát triển',
          humidity: 72.0,
          temperature: 26.0,
          details: 'Phát hiện rệp muỗi trên mặt dưới lá. Xịt dung dịch xà phòng 1% + dầu neem 0.5%.',
          reason: 'Rệp muỗi hút nhựa cây, làm lá vàng và còi cọc. Cần xử lý sớm.',
          notes: 'Sử dụng phương pháp hữu cơ an toàn cho gia vị. Kiểm tra lại sau 3 ngày.',
        },
        {
          name: 'Thu hoạch lá non lần đầu',
          activityType: ActivityType.HARVESTING,
          timestamp: new Date('2025-05-10T07:00:00Z'),
          plantName: 'Húng Quế',
          plantGrowStage: 'Đủ lá thu hoạch',
          details: 'Hái 150g lá húng quế non từ 20 cây. Chọn lá tươi, xanh, không sâu bệnh.',
          reason: 'Lá đã đủ kích thước và mùi thơm đặc trưng. Thu hoạch sáng sớm để giữ được độ tươi.',
          notes: 'Lá húng quế thơm nồng, màu xanh đậm. Dùng để nấu phở và các món Việt.',
        },
        {
          name: 'Bón phân thúc lá',
          activityType: ActivityType.FERTILIZING,
          timestamp: new Date('2025-05-15T17:00:00Z'),
          plantName: 'Húng Quế',
          plantGrowStage: 'Sau thu hoạch',
          soilPH: 7.0,
          soilMoisture: 45.0,
          temperature: 27.0,
          details: 'Bón phân NPK 20-10-10 pha 0.8% để thúc đẩy ra lá mới sau thu hoạch.',
          reason: 'Bổ sung đạm giúp cây nhanh chóng phục hồi và ra lá non nhiều hơn',
          notes: 'Tưới đều sau khi bón. Cây phản ứng tích cực, lá mới xuất hiện sau 5 ngày.',
        },
        {
          name: 'Kiểm tra và tỉa cành',
          activityType: ActivityType.PRUNING,
          timestamp: new Date('2025-05-22T10:00:00Z'),
          plantName: 'Húng Quế',
          plantGrowStage: 'Phát triển sau thu hoạch',
          details: 'Tỉa bỏ cành yếu, cành bị sâu. Giữ lại 4-5 cành chính khỏe mạnh/cây.',
          reason: 'Tạo tán cây đẹp, thông thoáng. Tập trung dinh dưỡng cho cành chính.',
          notes: 'Cành bị tỉa có thể giâm tạo cây mới. Cây có dáng đẹp, cân đối hơn.',
        },
        {
          name: 'Thu hoạch lần 2',
          activityType: ActivityType.HARVESTING,
          timestamp: new Date('2025-05-26T08:30:00Z'),
          plantName: 'Húng Quế',
          plantGrowStage: 'Thu hoạch lần 2',
          details: 'Hái 200g lá húng quế tươi. Năng suất tăng so với lần đầu.',
          reason: 'Cây đã ổn định, lá phát triển nhanh và đều hơn sau lần tỉa đầu tiên',
          notes: 'Chất lượng lá rất tốt, mùi thơm đậm đà. Gia đình rất hài lòng.',
        },
        {
          name: 'Chuẩn bị thu hạt',
          activityType: ActivityType.OTHER,
          timestamp: new Date('2025-05-30T11:00:00Z'),
          plantName: 'Húng Quế',
          plantGrowStage: 'Chuẩn bị ra hoa',
          details: 'Để 5 cây cho ra hoa để lấy hạt giống. Cắt bỏ nụ hoa ở 25 cây còn lại.',
          reason: 'Cần hạt giống cho vụ tiếp theo. Cắt nụ hoa để duy trì chất lượng lá.',
          notes: 'Chọn 5 cây khỏe nhất để lấy hạt. Hoa húng quế có màu trắng đẹp.',
        },
        {
          name: 'Tỉa ngọn lần 2',
          activityType: ActivityType.PRUNING,
          timestamp: new Date('2025-05-31T16:30:00Z'),
          plantName: 'Húng Quế',
          plantGrowStage: 'Kích thích phân cành lần 2',
          details: 'Tỉa ngọn 4cm ở các cành phụ để kích thích ra chồi cấp 3.',
          reason: 'Tăng mật độ cành lá, tạo cây có nhiều lá hơn cho thu hoạch tiếp theo',
          notes: 'Sau 2 lần tỉa, cây có dáng bụi đẹp. Dự kiến thu hoạch 300g lần sau.',
        },
      ],
    },

    // Garden 4: Vườn Cây Cà Chua - Mở rộng quy trình chi tiết
    {
      gardenId: gardens.find(g => g.gardenKey === '4')?.id,
      activities: [
        // Tháng 3: Chuẩn bị và gieo hạt
        {
          name: 'Chuẩn bị đất và luống trồng',
          activityType: ActivityType.SOIL_TESTING,
          timestamp: new Date('2025-03-10T07:00:00Z'),
          plantName: 'Cây cà chua',
          plantGrowStage: 'Chuẩn bị đất',
          humidity: 68.0,
          temperature: 26.0,
          soilPH: 6.0,
          soilMoisture: 25.0,
          details: 'Xới đất sâu 35cm, bỏ cỏ dại và rác. Bổ sung 20kg phân chuồng + 2kg vôi bột/100m2.',
          reason: 'Cà chua cần đất sâu, thoát nước tốt và pH 6.0-6.8. Vôi bột điều chỉnh pH.',
          notes: 'Đất ban đầu hơi chua (pH 5.8). Sau khi bổ sung vôi, pH tăng lên 6.2.',
        },
        {
          name: 'Làm luống và hệ thống tưới',
          activityType: ActivityType.OTHER,
          timestamp: new Date('2025-03-12T14:00:00Z'),
          plantName: 'Cây cà chua',
          plantGrowStage: 'Chuẩn bị trồng',
          details: 'Làm 3 luống cao 25cm, rộng 1m, dài 10m. Lắp hệ thống tưới nhỏ giọt.',
          reason: 'Luống cao giúp thoát nước tốt. Tưới nhỏ giọt tiết kiệm nước và giảm bệnh.',
          notes: 'Khoảng cách giữa các luống 60cm để thuận tiện di chuyển và chăm sóc.',
        },
        {
          name: 'Gieo hạt trong khay ươm',
          activityType: ActivityType.PLANTING,
          timestamp: new Date('2025-03-15T08:30:00Z'),
          plantName: 'Cây cà chua',
          plantGrowStage: 'Gieo hạt',
          humidity: 75.0,
          temperature: 24.0,
          lightIntensity: 600.0,
          soilMoisture: 65.0,
          details: 'Gieo 100 hạt cà chua F1 Việt Nam vào khay 200 ô. Đất ươm: cơ chất + phân compost.',
          reason: 'Gieo trong khay ươm dễ quản lý, tỷ lệ nảy mầm cao và cây con đồng đều',
          notes: 'Giống F1 cho năng suất cao, chống bệnh tốt. Che lưới 50% trong 5 ngày đầu.',
        },
        {
          name: 'Chăm sóc cây con trong ươm',
          activityType: ActivityType.WATERING,
          timestamp: new Date('2025-03-22T07:00:00Z'),
          plantName: 'Cây cà chua',
          plantGrowStage: 'Cây con 2 lá thật',
          humidity: 72.0,
          temperature: 25.0,
          soilMoisture: 60.0,
          details: 'Tưới phun sương 2 lần/ngày. Kiểm tra 85/100 hạt nảy mầm tốt.',
          reason: 'Cây con nhỏ cần độ ẩm cao và ổn định. Tưới nhẹ tránh làm đổ cây.',
          notes: 'Cây con phát triển đều, lá mầm xanh tươi. Loại bỏ 15 cây yếu và bệnh.',
        },

        // Tháng 4: Chăm sóc cây con và chuẩn bị trồng
        {
          name: 'Chuyển chậu lớn hơn',
          activityType: ActivityType.PLANTING,
          timestamp: new Date('2025-04-01T09:00:00Z'),
          plantName: 'Cây cà chua',
          plantGrowStage: 'Cây con 4-5 lá thật',
          soilPH: 6.3,
          soilMoisture: 55.0,
          details: 'Chuyển 70 cây con khỏe nhất vào chậu 15cm. Bổ sung đất mới và phân hữu cơ.',
          reason: 'Cây con đã đầy khay ươm, cần không gian lớn hơn để phát triển rễ',
          notes: 'Rễ cây trắng khỏe, không bị quấn. Chọn những cây thân to, lá xanh đậm.',
        },
        {
          name: 'Bón phân cho cây con',
          activityType: ActivityType.FERTILIZING,
          timestamp: new Date('2025-04-08T16:00:00Z'),
          plantName: 'Cây cà chua',
          plantGrowStage: 'Cây con đang lớn',
          soilPH: 6.4,
          soilMoisture: 50.0,
          temperature: 26.0,
          details: 'Bón phân NPK 15-15-15 nồng độ 0.5%. Mỗi cây 100ml, 2 lần/tuần.',
          reason: 'Cây con cần dinh dưỡng cân bằng để phát triển đều cả rễ, thân và lá',
          notes: 'Pha phân nhẹ để tránh cháy rễ. Cây phản ứng tốt, lá xanh hơn rõ rệt.',
        },
        {
          name: 'Luyện cây trước khi trồng',
          activityType: ActivityType.OTHER,
          timestamp: new Date('2025-04-15T08:00:00Z'),
          plantName: 'Cây cà chua',
          plantGrowStage: 'Chuẩn bị trồng ra vườn',
          humidity: 70.0,
          temperature: 27.0,
          lightIntensity: 1000.0,
          details: 'Đặt cây ngoài nắng 2-3 tiếng/ngày, tăng dần để cây thích nghi.',
          reason: 'Luyện cây giúp thích nghi với điều kiện ngoài trời, giảm sốc khi trồng',
          notes: 'Cây cao 15-20cm, thân chắc khỏe. Sẵn sàng trồng ra luống sau 1 tuần.',
        },

        // Tháng 4-5: Trồng và chăm sóc
        {
          name: 'Trồng cây con ra luống',
          activityType: ActivityType.PLANTING,
          timestamp: new Date('2025-04-20T06:30:00Z'),
          plantName: 'Cây cà chua',
          plantGrowStage: 'Trồng ra vườn',
          humidity: 68.0,
          temperature: 25.0,
          soilMoisture: 45.0,
          details: 'Trồng 60 cây con với khoảng cách 50cm x 60cm. Tưới định rễ ngay sau trồng.',
          reason: 'Khoảng cách phù hợp để cây phát triển tốt và dễ chăm sóc, thu hoạch',
          notes: 'Trồng vào buổi chiều mát để giảm stress. Che lưới 3 ngày đầu.',
        },
        {
          name: 'Bón phân lót cho cây mới trồng',
          activityType: ActivityType.FERTILIZING,
          timestamp: new Date('2025-04-22T16:30:00Z'),
          plantName: 'Cây cà chua',
          plantGrowStage: 'Mới trồng',
          soilPH: 6.2,
          soilMoisture: 50.0,
          temperature: 28.0,
          details: 'Bón 30g NPK 16-16-8 + 200g phân chuồng cho mỗi cây. Trộn đều với đất.',
          reason: 'Bổ sung dinh dưỡng ban đầu giúp cây phục hồi nhanh và sinh trưởng tốt',
          notes: 'Bón cách gốc 10cm để tránh cháy rễ. Tưới nhẹ sau khi bón.',
        },
        {
          name: 'Dựng giàn đỡ sớm',
          activityType: ActivityType.OTHER,
          timestamp: new Date('2025-04-25T14:00:00Z'),
          plantName: 'Cây cà chua',
          plantGrowStage: 'Cây con 25-30cm',
          details: 'Dựng giàn tre cao 2m cho mỗi cây. Buộc dây dẫn hướng từ sớm.',
          reason: 'Cà chua cần hỗ trợ từ sớm để thân cây thẳng, không bị gãy khi có trái',
          notes: 'Sử dụng cọc tre phi 3cm, cắm sâu 40cm. Dây buộc mềm, không siết chặt.',
        },
        {
          name: 'Kiểm tra độ pH đất định kỳ',
          activityType: ActivityType.SOIL_TESTING,
          timestamp: new Date('2025-05-01T10:00:00Z'),
          plantName: 'Cây cà chua',
          plantGrowStage: 'Phát triển',
          soilPH: 6.2,
          soilMoisture: 50.0,
          details: 'Đo pH đất tại 5 điểm khác nhau trong vườn. Trung bình pH = 6.2.',
          reason: 'Theo dõi pH đất để điều chỉnh kịp thời, đảm bảo cây hấp thụ dinh dưỡng tốt',
          notes: 'pH hơi thấp ở 2 điểm. Cần bổ sung vôi bột nhẹ ở những khu vực này.',
        },
        {
          name: 'Cắt chồi nách',
          activityType: ActivityType.PRUNING,
          timestamp: new Date('2025-05-05T07:30:00Z'),
          plantName: 'Cây cà chua',
          plantGrowStage: 'Cao 40-50cm',
          details: 'Cắt bỏ chồi nách dưới cành hoa đầu tiên. Giữ lại 1-2 thân chính.',
          reason: 'Tập trung dinh dưỡng cho thân chính và cành hoa, tăng năng suất trái',
          notes: 'Cắt vào buổi sáng khô ráo để vết cắt nhanh khô. Sử dụng dao sạch.',
        },
        {
          name: 'Phòng trừ sâu cuốn lá',
          activityType: ActivityType.PEST_CONTROL,
          timestamp: new Date('2025-05-10T08:00:00Z'),
          plantName: 'Cây cà chua',
          plantGrowStage: 'Bắt đầu ra hoa',
          humidity: 75.0,
          temperature: 26.5,
          details: 'Phun thuốc BT + Dimethoate 0.05% để diệt sâu cuốn lá và rầy.',
          reason: 'Sâu cuốn lá có thể phá hoại lá non, ảnh hưởng đến quá trình quang hợp',
          notes: 'Phun vào buổi chiều mát. Kiểm tra lại sau 3 ngày, hiệu quả diệt sâu 90%.',
        },
        {
          name: 'Bón phán ra hoa',
          activityType: ActivityType.FERTILIZING,
          timestamp: new Date('2025-05-15T17:00:00Z'),
          plantName: 'Cây cà chua',
          plantGrowStage: 'Ra hoa',
          soilPH: 6.3,
          soilMoisture: 48.0,
          temperature: 27.0,
          details: 'Bón phân NPK 15-30-15 để thúc đẩy ra hoa. 40g/cây, pha với nước tưới gốc.',
          reason: 'Lân cao giúp ra hoa nhiều và đều. Kali giúp hoa khỏe mạnh, tỷ lệ đậu trái cao.',
          notes: 'Hoa bắt đầu nở nhiều sau 1 tuần. Màu vàng đẹp, kích thước đều.',
        },
        {
          name: 'Hỗ trợ thụ phân',
          activityType: ActivityType.OTHER,
          timestamp: new Date('2025-05-20T09:00:00Z'),
          plantName: 'Cây cà chua',
          plantGrowStage: 'Đang hoa',
          humidity: 72.0,
          temperature: 28.0,
          details: 'Lắc nhẹ cành hoa vào 9-10h sáng để hỗ trợ thụ phân tự nhiên.',
          reason: 'Cà chua tự thụ phân, lắc nhẹ giúp phấn hoa bay tốt hơn, tăng tỷ lệ đậu trái',
          notes: 'Thực hiện 3 ngày liên tiếp trong thời kỳ hoa nở. Tỷ lệ đậu trái ước tính 80%.',
        },
        {
          name: 'Tỉa lá già dưới cành trái',
          activityType: ActivityType.PRUNING,
          timestamp: new Date('2025-05-25T08:30:00Z'),
          plantName: 'Cây cà chua',
          plantGrowStage: 'Có trái non',
          details: 'Cắt bỏ lá già, lá vàng dưới cành có trái đầu tiên. Tạo thông thoáng.',
          reason: 'Giảm độ ẩm quanh gốc, phòng bệnh nấm. Tập trung dinh dưỡng cho trái',
          notes: 'Trái non đã to bằng quả bóng bàn. Cây khỏe mạnh, không dấu hiệu bệnh.',
        },
        {
          name: 'Dựng giàn đỡ cao hơn',
          activityType: ActivityType.OTHER,
          timestamp: new Date('2025-05-27T15:00:00Z'),
          plantName: 'Cây cà chua',
          plantGrowStage: 'Cây cao 80cm',
          details: 'Nối thêm cọc tre để đạt chiều cao 2.5m. Buộc dây dẫn hướng cho cành mang trái.',
          reason: 'Cây cà chua có thể cao 2m, cần giàn đỡ chắc chắn để chịu được trọng lượng trái',
          notes: 'Cây phát triển nhanh hơn dự kiến. Thân to khỏe, có nhiều cành hoa.',
        },
        {
          name: 'Nhổ cỏ và bón thúc trái',
          activityType: ActivityType.WEEDING,
          timestamp: new Date('2025-05-29T07:30:00Z'),
          plantName: 'Cây cà chua',
          plantGrowStage: 'Trái đang lớn',
          details: 'Nhổ cỏ dại trong bán kính 80cm quanh gốc. Bón NPK 10-20-20 để thúc trái lớn.',
          reason: 'Loại bỏ cạnh tranh dinh dưỡng. Bón phân giàu lân, kali giúp trái phát triển tốt',
          notes: 'Cỏ dại ít hơn nhờ luống cao và mulch. Trái có kích thước đều, màu xanh đẹp.',
        },
        {
          name: 'Kiểm tra và phòng bệnh héo vi khuẩn',
          activityType: ActivityType.PEST_CONTROL,
          timestamp: new Date('2025-05-31T10:00:00Z'),
          plantName: 'Cây cà chua',
          plantGrowStage: 'Sắp thu hoạch',
          humidity: 78.0,
          temperature: 29.0,
          details: 'Kiểm tra toàn bộ vườn, không phát hiện bệnh. Phun Streptomycin 0.02% phòng ngừa.',
          reason: 'Thời tiết nóng ẩm dễ phát sinh bệnh vi khuẩn. Phòng ngừa tốt hơn chữa trị.',
          notes: 'Cây khỏe mạnh, lá xanh tươi. Trái đã to gần bằng quả tennis, màu xanh đều.',
        },
      ],
    },
  ];

  let totalActivities = 0;
  let totalEvaluations = 0;

  for (const gardenData of gardenActivities) {
    if (!gardenData.gardenId) continue;

    for (const activityData of gardenData.activities) {
      // Tạo activity
      const activity = await prisma.gardenActivity.create({
        data: {
          gardenId: gardenData.gardenId,
          gardenerId: superGardener.gardener.userId,
          name: activityData.name,
          activityType: activityData.activityType,
          timestamp: activityData.timestamp,
          plantName: activityData.plantName,
          plantGrowStage: activityData.plantGrowStage,
          humidity: activityData.humidity,
          temperature: activityData.temperature,
          lightIntensity: activityData.lightIntensity,
          waterLevel: 1,
          rainfall: 0,
          soilMoisture: activityData.soilMoisture,
          soilPH: activityData.soilPH,
          details: activityData.details,
          reason: activityData.reason,
          notes: activityData.notes,
        },
      });

      // Tạo evaluation cho mỗi activity với tỷ lệ cao hơn
      const shouldCreateEvaluation = Math.random() > 0.2; // 80% chance tạo evaluation
      
      if (shouldCreateEvaluation) {
        const isSystemEvaluation = Math.random() > 0.5; // 50% là system evaluation
        
        await prisma.activityEvaluation.create({
          data: {
            gardenActivityId: activity.id,
            evaluatorType: isSystemEvaluation ? EvaluatorType.SYSTEM : EvaluatorType.USER,
            gardenerId: isSystemEvaluation ? null : superGardener.gardener.userId,
            evaluatedAt: new Date(activity.timestamp.getTime() + (12 + Math.random() * 48) * 60 * 60 * 1000), // 12-60 giờ sau activity
            outcome: getRandomOutcome(activityData.activityType),
            rating: Math.floor(Math.random() * 2) + 4, // Rating 4-5
            metrics: getRandomMetrics(activityData.activityType),
            comments: getRandomComments(activityData.activityType),
            humidity: activityData.humidity ? activityData.humidity + (Math.random() - 0.5) * 8 : null,
            temperature: activityData.temperature ? activityData.temperature + (Math.random() - 0.5) * 4 : null,
            soilMoisture: activityData.soilMoisture ? Math.max(20, Math.min(80, activityData.soilMoisture + (Math.random() - 0.5) * 15)) : null,
            soilPH: activityData.soilPH ? Math.max(5.5, Math.min(8.0, activityData.soilPH + (Math.random() - 0.5) * 0.6)) : null,
          },
        });
        totalEvaluations++; 
      }

      totalActivities++;
    }
  }

  console.log(`🌱 Đã seed thành công ${totalActivities} hoạt động vườn cho supergardener.`);
  console.log(`📊 Đã tạo ${totalEvaluations} đánh giá hoạt động.`);
}

// Mở rộng functions với nhiều options hơn và chi tiết hơn cho người Việt
function getRandomOutcome(activityType: ActivityType): string {
  const outcomes = {
    [ActivityType.PLANTING]: [
      'Gieo trồng thành công', 'Tỷ lệ nảy mầm cao', 'Cây con phát triển tốt', 
      'Giống cây thích nghi tốt', 'Kỹ thuật gieo chuẩn', 'Thời điểm gieo phù hợp',
      'Đất chuẩn bị tốt cho gieo trồng', 'Cây con đồng đều'
    ],
    [ActivityType.WATERING]: [
      'Tưới nước hiệu quả', 'Đất giữ ẩm tốt', 'Cây hấp thụ nước đều', 
      'Lượng nước vừa phải', 'Thời điểm tưới phù hợp', 'Không bị úng nước',
      'Hệ thống tưới hoạt động tốt', 'Độ ẩm đất ổn định'
    ],
    [ActivityType.FERTILIZING]: [
      'Cây phản ứng tích cực với phân', 'Hiệu quả bón phân cao', 'Lá xanh hơn rõ rệt',
      'Bón đúng liều lượng', 'Phân được hấp thụ tốt', 'Cây phát triển nhanh hơn',
      'Không có dấu hiệu cháy phân', 'Dinh dưỡng cân bằng'
    ],
    [ActivityType.PRUNING]: [
      'Tỉa cành đúng kỹ thuật', 'Cây phát triển đều sau tỉa', 'Kích thích tăng trưởng tốt',
      'Hình dáng cây đẹp hơn', 'Ra chồi mới nhiều', 'Thông thoáng tán lá',
      'Giảm nguy cơ sâu bệnh', 'Tập trung dinh dưỡng hiệu quả'
    ],
    [ActivityType.HARVESTING]: [
      'Thu hoạch đúng độ chín', 'Chất lượng sản phẩm cao', 'Năng suất đạt kỳ vọng',
      'Thời điểm thu hoạch tối ưu', 'Sản phẩm tươi ngon', 'Bảo quản tốt sau thu hoạch',
      'Khách hàng hài lòng', 'Giá trị kinh tế cao'
    ],
    [ActivityType.PEST_CONTROL]: [
      'Kiểm soát sâu bệnh hiệu quả', 'Không phát hiện sâu bệnh mới', 'Phòng ngừa thành công',
      'Sử dụng thuốc an toàn', 'Giảm tỷ lệ sâu bệnh rõ rệt', 'Cây khỏe mạnh trở lại',
      'Phương pháp hữu cơ hiệu quả', 'Môi trường an toàn'
    ],
    [ActivityType.SOIL_TESTING]: [
      'Các chỉ số đất trong mức bình thường', 'pH đất phù hợp với cây trồng', 'Cần điều chỉnh một số chỉ số',
      'Đất giàu chất hữu cơ', 'Độ thoát nước tốt', 'Cấu trúc đất lý tưởng',
      'Cần bổ sung vi lượng', 'Đất chua cần cải tạo'
    ],
    [ActivityType.WEEDING]: [
      'Làm cỏ sạch sẽ', 'Giảm cạnh tranh dinh dưỡng', 'Khu vườn gọn gàng hơn',
      'Loại bỏ được cỏ dại có hại', 'Tiết kiệm được công chăm sóc', 'Cây trồng phát triển tốt hơn',
      'Giảm nơi ẩn náp của sâu bệnh', 'Tăng tính thẩm mỹ vườn'
    ],
    [ActivityType.OTHER]: [
      'Hoạt động thành công', 'Đạt mục tiêu đề ra', 'Hiệu quả cao',
      'Kỹ thuật thực hiện đúng', 'Cải thiện điều kiện vườn', 'Hỗ trợ tốt cho cây trồng',
      'Tiết kiệm thời gian chăm sóc', 'Nâng cao chất lượng sản phẩm'
    ],
  };
  
  const options = outcomes[activityType] || ['Hoạt động thành công', 'Kết quả tích cực'];
  return options[Math.floor(Math.random() * options.length)];
}

function getRandomMetrics(activityType: ActivityType): any {
  const baseMetrics = {
    [ActivityType.PLANTING]: {
      "ty_le_nay_mam": `${Math.floor(Math.random() * 20 + 75)}%`,
      "so_luong_cay_con": Math.floor(Math.random() * 30 + 20),
      "chieu_cao_trung_binh": `${(Math.random() * 10 + 5).toFixed(1)}cm`,
      "thoi_gian_nay_mam": `${Math.floor(Math.random() * 5 + 3)} ngày`
    },
    [ActivityType.WATERING]: {
      "luong_nuoc_su_dung": `${(Math.random() * 8 + 3).toFixed(1)}L`,
      "do_am_dat_sau_tuoi": `${Math.floor(Math.random() * 20 + 50)}%`,
      "thoi_gian_thau_nuoc": `${Math.floor(Math.random() * 10 + 10)} phút`,
      "hieu_qua_hap_thu": "Tốt"
    },
    [ActivityType.FERTILIZING]: {
      "phan_ung_cay_sau_bon": `${(Math.random() * 20 + 10).toFixed(1)}% cải thiện`,
      "mau_la_sau_3_ngay": "Xanh đậm hơn",
      "tang_truong_thuan": `${(Math.random() * 3 + 1).toFixed(1)}cm/tuần`,
      "chi_phi_phan_bon": `${Math.floor(Math.random() * 50 + 20)}k VND`
    },
    [ActivityType.HARVESTING]: {
      "nang_suat_thu_hoach": `${(Math.random() * 4 + 1).toFixed(1)}kg`,
      "chat_luong_san_pham": ["A", "A+", "Loại 1"][Math.floor(Math.random() * 3)],
      "gia_tri_thuong_mai": `${Math.floor(Math.random() * 100 + 50)}k VND`,
      "thoi_han_bao_quan": `${Math.floor(Math.random() * 5 + 3)} ngày`
    },
    [ActivityType.PRUNING]: {
      "so_choi_moi_ra": Math.floor(Math.random() * 8 + 3),
      "cai_thien_hinh_dang": "Đều đặn hơn",
      "giam_rui_ro_benh": `${Math.floor(Math.random() * 30 + 20)}%`,
      "tang_nang_suat_du_kien": `${Math.floor(Math.random() * 15 + 10)}%`
    },
    [ActivityType.PEST_CONTROL]: {
      "ty_le_giam_sau": `${Math.floor(Math.random() * 30 + 70)}%`,
      "muc_do_an_toan": "Cao",
      "thoi_gian_hieu_luc": `${Math.floor(Math.random() * 10 + 7)} ngày`,
      "chi_phi_xu_ly": `${Math.floor(Math.random() * 30 + 15)}k VND`
    },
    [ActivityType.SOIL_TESTING]: {
      "pH_dat": (Math.random() * 2 + 5.5).toFixed(1),
      "do_am_dat": `${Math.floor(Math.random() * 30 + 40)}%`,
      "ham_luong_huu_co": `${(Math.random() * 3 + 2).toFixed(1)}%`,
      "khuyen_cao": "Cần bổ sung phân hữu cơ"
    },
    [ActivityType.WEEDING]: {
      "dien_tich_lam_co": `${Math.floor(Math.random() * 20 + 30)}m²`,
      "loai_co_dai_chinh": ["Cỏ kê", "Cỏ mần trầu", "Cỏ tranh", "Cỏ lá gai"][Math.floor(Math.random() * 4)],
      "thoi_gian_thuc_hien": `${Math.floor(Math.random() * 2 + 1)} giờ`,
      "hieu_qua_lam_co": `${Math.floor(Math.random() * 20 + 80)}%`
    },
    [ActivityType.OTHER]: {
      "muc_do_hoan_thanh": `${Math.floor(Math.random() * 20 + 80)}%`,
      "thoi_gian_thuc_hien": `${Math.floor(Math.random() * 3 + 1)} giờ`,
      "muc_do_kho_khan": ["Dễ", "Trung bình", "Khó"][Math.floor(Math.random() * 3)],
      "ket_qua_dat_duoc": "Đạt yêu cầu"
    }
  };
  
  return baseMetrics[activityType] || { "trang_thai": "Hoàn thành tốt" };
}

function getRandomComments(activityType: ActivityType): string {
  const comments = {
    [ActivityType.PLANTING]: [
      'Hạt giống chất lượng tốt, nảy mầm đồng đều',
      'Kỹ thuật gieo đúng chuẩn, cây con khỏe mạnh', 
      'Thời tiết thuận lợi cho việc gieo trồng',
      'Đất đã được chuẩn bị kỹ lưỡng trước khi gieo',
      'Cây con phát triển nhanh hơn dự kiến',
      'Giống địa phương thích nghi tốt với thổ nhưỡng',
      'Tỷ lệ nảy mầm cao hơn so với vụ trước',
      'Cần theo dõi sát sao trong tuần đầu tiên'
    ],
    [ActivityType.WATERING]: [
      'Hệ thống tưới nhỏ giọt hoạt động ổn định',
      'Đất giữ ẩm tốt nhờ mulch hữu cơ',
      'Cây hấp thụ nước đều, không bị úng hay thiếu nước',
      'Tưới vào buổi sáng sớm giúp cây hấp thụ tốt nhất',
      'Lượng nước phù hợp với giai đoạn phát triển của cây',
      'Chất lượng nước tưới tốt, không có tạp chất',
      'Áp lực nước ổn định, phun đều khắp khu vực',
      'Tiết kiệm nước nhờ tưới đúng thời điểm'
    ],
    [ActivityType.FERTILIZING]: [
      'Phân bón hữu cơ an toàn cho sức khỏe',
      'Cây phản ứng tích cực ngay sau 3-5 ngày bón phân',
      'Tỷ lệ N-P-K phù hợp với giai đoạn sinh trưởng',
      'Bón phân đúng liều, không gây cháy lá hay rễ',
      'Lá cây xanh đậm và dày hơn rõ rệt',
      'Kết hợp bón gốc và phun lá để hiệu quả cao nhất',
      'Sử dụng phân compost tự làm, giảm chi phí đầu vào',
      'Cây sinh trưởng mạnh, chuẩn bị ra hoa sớm hơn dự kiến'
    ],
    [ActivityType.HARVESTING]: [
      'Thu hoạch đúng độ chín, đảm bảo chất lượng tốt nhất',
      'Năng suất cao hơn kỳ vọng ban đầu',
      'Sản phẩm tươi ngon, được khách hàng đánh giá cao',
      'Thời điểm thu hoạch lý tưởng, tránh được mưa lớn',
      'Kỹ thuật thu hoạch đúng cách, giữ được độ tươi lâu',
      'Phân loại sản phẩm theo tiêu chuẩn chất lượng',
      'Bao bì và bảo quản sản phẩm đúng quy trình',
      'Giá bán ổn định, lợi nhuận như kỳ vọng'
    ],
    [ActivityType.PRUNING]: [
      'Tỉa cành đúng thời điểm, kích thích ra chồi mới',
      'Sử dụng dụng cụ sạch sẽ, tránh lây nhiễm bệnh',
      'Cây có dáng đẹp hơn, cân đối và thông thoáng',
      'Loại bỏ được cành già, yếu và bị sâu bệnh',
      'Tăng cường thông gió, giảm độ ẩm trong tán lá',
      'Tập trung dinh dưỡng cho cành chính và trái',
      'Dự kiến năng suất sẽ tăng nhờ tỉa cành hợp lý',
      'Cây phục hồi nhanh sau khi tỉa, ra lá non nhiều'
    ],
    [ActivityType.PEST_CONTROL]: [
      'Sử dụng phương pháp sinh học an toàn cho môi trường',
      'Hiệu quả diệt sâu cao, không ảnh hưởng đến cây trồng',
      'Phát hiện sớm và xử lý kịp thời, tránh bùng phát',
      'Kết hợp nhiều biện pháp phòng trừ tổng hợp',
      'Không có dấu hiệu kháng thuốc ở quần thể sâu bệnh',
      'Chi phí phòng trừ hợp lý, hiệu quả kinh tế cao',
      'Tần suất xuất hiện sâu bệnh giảm rõ rệt',
      'Cây trồng khỏe mạnh trở lại sau xử lý'
    ],
    [ActivityType.SOIL_TESTING]: [
      'Kết quả phân tích đất cung cấp thông tin hữu ích',
      'Các chỉ số đất phù hợp với yêu cầu của cây trồng',
      'Cần điều chỉnh pH để tối ưu hóa hấp thụ dinh dưỡng',
      'Hàm lượng chất hữu cơ cần được cải thiện',
      'Đất có cấu trúc tốt, thoát nước và giữ ẩm cân bằng',
      'Theo dõi định kỳ để điều chỉnh phương án bón phân',
      'So sánh với lần kiểm tra trước, đất có cải thiện rõ rệt',
      'Đề xuất phương án cải tạo đất phù hợp và hiệu quả'
    ],
    [ActivityType.WEEDING]: [
      'Làm cỏ định kỳ giúp cây trồng phát triển tốt hơn',
      'Sử dụng mulch để hạn chế cỏ dại mọc lại',
      'Nhổ cỏ khi còn nhỏ, dễ dàng và hiệu quả hơn',
      'Kết hợp làm cỏ với xới đất, tăng độ tơi xốp',
      'Cỏ dại được thu gom làm phân compost',
      'Giảm đáng kể sự cạnh tranh về nước và dinh dưỡng',
      'Khu vườn gọn gàng, sạch sẽ và dễ quan sát',
      'Thời tiết khô ráo thuận lợi cho việc làm cỏ'
    ],
    [ActivityType.OTHER]: [
      'Công việc được thực hiện đúng kế hoạch và tiến độ',
      'Áp dụng kỹ thuật mới, hiệu quả cao hơn phương pháp cũ',
      'Đầu tư ban đầu hợp lý, mang lại lợi ích lâu dài',
      'Cải thiện điều kiện làm việc và chăm sóc cây trồng',
      'Tận dụng tốt nguồn lực có sẵn, tiết kiệm chi phí',
      'Kinh nghiệm tích lũy giúp thực hiện nhanh và chính xác',
      'Kết quả đạt được vượt mong đợi ban đầu',
      'Chuẩn bị tốt cho giai đoạn chăm sóc tiếp theo'
    ]
  };
  
  const options = comments[activityType] || [
    'Hoạt động được thực hiện thành công và hiệu quả',
    'Kết quả đạt được đúng như mong đợi',
    'Cây trồng phản ứng tích cực với biện pháp thực hiện',
    'Kinh nghiệm tích lũy giúp cải thiện kỹ thuật chăm sóc'
  ];
  return options[Math.floor(Math.random() * options.length)];
}