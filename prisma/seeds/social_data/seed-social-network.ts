import { Comment, Post, PrismaClient, Tag, Vote, VoteTargetType } from '@prisma/client';

export async function seedSocialNetwork(prisma: PrismaClient): Promise<void> {
  // Kiểm tra dữ liệu cần thiết đã có chưa
  const gardeners = await prisma.gardener.findMany({
    include: { user: true }
  });
  
  const gardens = await prisma.garden.findMany();
  
  if (gardeners.length === 0) {
    throw new Error('Chưa có gardener nào. Vui lòng chạy seedUsers và seedGardeners trước.');
  }

  if (gardens.length === 0) {
    throw new Error('Chưa có garden nào. Vui lòng chạy seedGardens trước.');
  }

  await prisma.$transaction(async (tx) => {
      // 1. Seed Tags
  const tagsData = [
    'rau-sach', 'hoa-canh', 'cay-thuoc', 'gia-vi', 'thao-moc',
    'trong-nha', 'san-thuong', 'ban-cong', 'vuon-nho', 'huu-co',
    'khong-hoa-chat', 'de-trong', 'kho-cham-soc', 'mua-he', 'mua-dong',
    'nang-suat-cao', 'tiet-kiem-nuoc', 'chau-canh', 'dat-trong', 
    'hydroponic', 'aquaponic', 'vertical-garden', 'urban-farming',
    'permaculture', 'companion-planting', 'pest-control', 'fertilizer',
    'composting', 'seedling', 'harvest', 'pruning', 'watering',
    'greenhouse', 'seasonal', 'beginner-friendly', 'advanced',
    'organic', 'sustainable', 'indoor-garden', 'outdoor-garden',
    'container-garden', 'raised-bed', 'soil-health', 'plant-care',
    'disease-prevention', 'natural-fertilizer', 'eco-friendly'
  ];

  const createdTags: Tag[] = [];
  for (const tagName of tagsData) {
    const tag = await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName }
    });
    createdTags.push(tag);
  }

  console.log(`✅ Đã seed ${createdTags.length} tags.`);

  // 2. Seed Posts - 20 posts chi tiết
  const postsData = [
    {
      gardenerId: gardeners[0].userId,
      gardenId: gardens[0]?.id,
      plantName: 'Rau Muống',
      plantGrowStage: 'Thu hoạch',
      title: 'Bí quyết trồng rau muống xanh tốt cả năm - Từ gieo đến thu hoạch',
      content: `Chào mọi người! Hôm nay mình muốn chia sẻ kinh nghiệm 3 năm trồng rau muống. Từ khi bắt đầu đến giờ, mình đã thu hoạch được hơn 200kg rau muống từ khu vườn nhỏ 10m2! 🌿

## 🌱 **CHUẨN BỊ ĐẤT VÀ GIỐNG**

**Loại đất tốt nhất:**
- Đất phù sa pha cát (tỷ lệ 7:3)
- Trộn thêm 30% phân hữu cơ đã phân hủy hoàn toàn
- Thêm 5% tro trấu để thoát nước và cung cấp kali
- pH từ 6.0-7.0 (dùng vôi bột điều chỉnh nếu cần)

**Chọn giống:** Mình đã thử nhiều giống và recommend 3 loại:
1. **Muống lá tre:** Lá nhỏ, giòn, chịu nóng tốt
2. **Muống lá to:** Năng suất cao, lá mềm
3. **Muống dây:** Phù hợp khí hậu mát, ngọt nước

## 💧 **CHẾ ĐỘ TƯỚI NƯỚC CHI TIẾT**
- **Giai đoạn gieo - nảy mầm:** Tưới nhẹ 2 lần/ngày
- **Giai đoạn cây con:** 1 lần/ngày vào buổi sáng
- **Giai đoạn phát triển:** Ngập nước 5-7cm hoặc tưới 2 lần/ngày

Kết quả: Rau xanh mướt, giòn ngọt, không sâu bệnh! Ai có kinh nghiệm gì khác chia sẻ thêm nhé! 🌿`,
      tags: ['rau-sach', 'de-trong', 'huu-co', 'nang-suat-cao', 'beginner-friendly'],
      images: [
        'pictures/post/post-1-1-20250525T083000Z.png',
        'pictures/post/post-1-2-20250525T083000Z.png',
        'pictures/post/post-1-3-20250525T083000Z.png'
      ],
      createdAt: new Date('2025-05-25T08:30:00Z')
    },
    {
      gardenerId: gardeners[1]?.userId || gardeners[0].userId,
      gardenId: gardens[1]?.id,
      plantName: 'Cây Lan ý',
      plantGrowStage: 'Ra hoa',
      title: 'Lan ý nở hoa rực rỡ sau 2 tháng chăm sóc - Chia sẻ bí quyết thành công',
      content: `Xin chào cả nhà! Hôm nay là ngày đặc biệt với mình vì những bông hoa Lan ý đầu tiên đã nở rộ! 🌸 

## 🏠 **CHỌN VỊ TRÍ PHÙ HỢP**
- Ban công hướng Đông hoặc Đông Nam
- Có ánh sáng sớm mai nhưng tránh nắng gắt 10h-14h
- Thông thoáng, không bị ứ khí

## 🌱 **CÁCH CHĂM SÓC CHI TIẾT**
**Tưới nước:** 2 ngày/lần, kiểm tra độ ẩm đất
**Bón phân:** NPK 20-20-20 loãng 2 tuần/lần
**Phòng trừ sâu bệnh:** Xịt neem oil 1 tuần/lần

Từ khi trồng đến nay 2 tháng, cây phát triển vượt mong đợi. Hoa có màu tím nhạt rất đẹp, thơm nhẹ vào buổi sáng sớm! 💜`,
      tags: ['hoa-canh', 'ban-cong', 'de-trong', 'beginner-friendly'],
      images: [
        'pictures/post/post-2-1-20250528T154500Z.png',
        'pictures/post/post-2-2-20250528T154500Z.png'
      ],
      createdAt: new Date('2025-05-28T15:45:00Z')
    },
    {
      gardenerId: gardeners[2]?.userId || gardeners[0].userId,
      plantName: 'Cà Chua Cherry',
      plantGrowStage: 'Chín đỏ',
      title: 'Bí mật thu hoạch 5kg cà chua cherry từ 1 cây - Hướng dẫn từ A đến Z',
      content: `Xin chào ace! Hôm nay mình vô cùng phấn khích được chia sẻ thành quả sau 4 tháng trồng cà chua cherry! 🍅

## 🌱 **CHỌN GIỐNG VÀ GIEO HẠT**
**Giống mình đã thử:**
1. **Cherry Red F1** (đang trồng): Quả đỏ, ngọt, chịu bệnh tốt
2. **Cherry Yellow F1**: Quả vàng, chua nhẹ, đẹp mắt
3. **Sweet Million**: Quả nhỏ, rất ngọt, năng suất cao

**Quy trình gieo hạt:**
- Ngâm hạt trong nước ấm 40°C trong 8 tiếng
- Gieo vào khay xốp, đất mịn, sâu 0.5cm
- Độ ẩm 80%, che màng bọc thực phẩm

## 📊 **KẾT QUẢ THU HOẠCH**
- **Tổng sản lượng:** 4.8kg/cây
- **Số lần thu hoạch:** 25 lần
- **Độ ngọt:** 8-10 độ Brix

Cảm ơn mọi người đã đọc! Ai có thắc mắc gì về trồng cà chua cherry thì hỏi mình nhé! 🤗`,
      tags: ['nang-suat-cao', 'vuon-nho', 'harvest', 'beginner-friendly', 'organic'],
      images: [
        'pictures/post/post-3-1-20250530T091500Z.png',
        'pictures/post/post-3-2-20250530T091500Z.png',
        'pictures/post/post-3-3-20250530T091500Z.png'
      ],
      createdAt: new Date('2025-05-30T09:15:00Z')
    },
    {
      gardenerId: gardeners[3]?.userId || gardeners[0].userId,
      gardenId: gardens[2]?.id,
      plantName: 'Hoa Hướng Dương',
      plantGrowStage: 'Lá mầm',
      title: 'Hạt hướng dương nảy mầm kỳ diệu - Nhật ký 10 ngày đầu đời',
      content: `Chào mọi người! Mình vừa trải qua 10 ngày thú vị nhất từ khi bắt đầu làm vườn! 🌻

## 📅 **NHẬT KÝ TỪNG NGÀY**

**NGÀY 1:** Gieo hạt sâu 2cm, úp bát nhựa trong suốt
**NGÀY 3:** XUẤT HIỆN! Thấy đốm trắng nhỏ nhú lên!
**NGÀY 5:** Cặp lá mầm đầu tiên xuất hiện! 🌿
**NGÀY 7:** Lá thật đầu tiên bắt đầu nhú ra
**NGÀY 10:** Cây cao 10cm, có 2 lá thật rõ ràng

## 🌡️ **ĐIỀU KIỆN LÝ TƯỞNG**
- **Nhiệt độ:** Ban ngày 25-30°C, ban đêm 18-24°C
- **Độ ẩm:** 60-70%, đất ẩm vừa phải
- **Ánh sáng:** Giai đoạn đầu cần ánh sáng gián tiếp

Thật kỳ diệu khi chứng kiến sự sống phát triển! Mọi người có ai đang trồng hướng dương không? 🌻💚`,
      tags: ['hoa-canh', 'seedling', 'ban-cong', 'beginner-friendly'],
      images: [
        'pictures/post/post-4-1-20250531T072000Z.png',
        'pictures/post/post-4-2-20250531T072000Z.png'
      ],
      createdAt: new Date('2025-05-31T07:20:00Z')
    },
    {
      gardenerId: gardeners[4]?.userId || gardeners[0].userId,
      plantName: 'Bạc Hà',
      plantGrowStage: 'Sum sê',
      title: 'Vườn thảo mộc mini trong nhà - 1 tháng và những điều bất ngờ!',
      content: `Xin chào tất cả! Đúng 1 tháng từ ngày setup vườn thảo mộc mini trong nhà! 🌿

## 🌱 **DANH SÁCH CÂY HIỆN TẠI**
**Những "siêu sao":**
1. **Bạc hà:** Từ 1 cành giâm → 3 chậu sum sê
2. **Húng quế:** Hái mỗi ngày vẫn ra lá mới
3. **Tía tô:** Lá to bằng bàn tay, màu tím đẹp
4. **Ngải cứu:** Thơm nức, đuổi muỗi hiệu quả

## 💡 **HỆ THỐNG CHIẾU SÁNG**
- **Đèn LED grow light:** 2 bóng 36W full spectrum
- **Thời gian:** 12 tiếng/ngày (6h sáng - 6h chiều)
- **Chi phí điện:** ~50,000đ/tháng

## 🌿 **KINH NGHIỆM BẠC HÀ**
- **Dễ giâm:** Cắm vào nước 7 ngày là có rễ
- **Sinh trưởng nhanh:** 1 tháng từ cành → chậu đầy
- **Đa năng:** Làm trà, nấu chè, khử mùi tủ lạnh

Ai muốn bắt đầu vườn thảo mộc trong nhà thì bạc hà là lựa chọn số 1! 💚`,
      tags: ['thao-moc', 'trong-nha', 'gia-vi', 'de-trong', 'urban-farming'],
      images: [
        'pictures/post/post-5-1-20250529T143000Z.png',
        'pictures/post/post-5-2-20250529T143000Z.png'
      ],
      createdAt: new Date('2025-05-29T14:30:00Z')
    },
    {
      gardenerId: gardeners[0].userId,
      title: 'Hướng dẫn làm phân compost từ rác thải bếp - Tiết kiệm triệu đồng mỗi năm',
      content: `Chia sẻ cách làm phân compost tại nhà đơn giản mà hiệu quả! ♻️

## 🥬 **NGUYÊN LIỆU CẦN THIẾT**
- **Rác xanh (60%):** Vỏ rau củ, lá cây, cỏ cắt
- **Rác nâu (40%):** Lá khô, giấy, bìa carton nhỏ
- **Chế phẩm EM:** Men vi sinh hoặc dung dịch ủ compost

## 🔄 **QUY TRÌNH CHI TIẾT**
1️⃣ **Chuẩn bị thùng:** Thùng nhựa có nắp, khoan lỗ thoát khí
2️⃣ **Xếp lớp:** Lớp nâu - lớp xanh - rắc men - lặp lại
3️⃣ **Đảo trộn:** 1 tuần/lần bằng xẻng nhỏ
4️⃣ **Kiểm soát độ ẩm:** Ẩm như miếng bọt biển vắt

## ⏰ **TIMELINE HOÀN THÀNH**
- **Tuần 1-2:** Nhiệt độ tăng, mùi lên men nhẹ
- **Tuần 3-4:** Nhiệt độ giảm, nguyên liệu mềm ra
- **Tuần 5-8:** Màu nâu đen, mùi đất, hoàn thành!

## 💰 **HIỆU QUẢ KINH TẾ**
Phân compost tự làm rẻ, sạch, cây trồng rất thích! Đã tiết kiệm được cả triệu tiền phân mỗi năm 💰

Ai quan tâm có thể hỏi thêm chi tiết nhé! #CompostTaiNha #TietKiem #XanhSach`,
      tags: ['composting', 'huu-co', 'tiet-kiem-nuoc', 'urban-farming', 'eco-friendly'],
      images: [
        'pictures/post/post-6-1-20250526T160000Z.png',
        'pictures/post/post-6-2-20250526T160000Z.png'
      ],
      createdAt: new Date('2025-05-26T16:00:00Z')
    },
    {
      gardenerId: gardeners[1]?.userId || gardeners[0].userId,
      title: 'Hệ thống tưới nước tự động cho người bận rộn - Setup chi phí 800k',
      content: `Mình vừa lắp xong hệ thống tưới tự động cho 20 chậu cây! 🤖

## ⚙️ **THIẾT BỊ SỬ DỤNG**
- **Bơm nước mini 12V:** 150,000đ
- **Timer điện tử:** 200,000đ
- **Ống PE 6mm + đầu nhỏ giọt:** 300,000đ
- **Bình chứa nước 50L:** 150,000đ

## ⏰ **CÀI ĐẶT HIỆN TẠI**
- **Sáng 6h:** Tưới 15 phút
- **Chiều 17h:** Tưới 10 phút
- **Điều chỉnh:** Theo mùa và loại cây

## ✅ **KẾT QUẢ THỰC TẾ**
Đi công tác 1 tuần cây vẫn xanh tốt! Tiết kiệm thời gian và nước, tưới đều đặn hơn tưới tay.

## 💡 **MẸO HAY**
Thêm phân tan chậm vào bình nước để vừa tưới vừa bón phân!

Ai quan tâm mình có thể hướng dẫn chi tiết cách lắp đặt nhé! 🛠️`,
      tags: ['tiet-kiem-nuoc', 'urban-farming', 'hydroponic', 'watering'],
      images: [
        'pictures/post/post-7-1-20250527T111500Z.png',
        'pictures/post/post-7-2-20250527T111500Z.png'
      ],
      createdAt: new Date('2025-05-27T11:15:00Z')
    },
    {
      gardenerId: gardeners[2]?.userId || gardeners[0].userId,
      title: 'Cách nhân giống hoa hồng bằng cành giâm - Thành công 95%!',
      content: `Sau nhiều lần thử nghiệm, cuối cùng mình đã tìm ra bí quyết giâm hoa hồng thành công! 🌹

## 🗓️ **THỜI ĐIỂM TỐT NHẤT**
Cuối thu, đầu đông (tháng 10-12) - thời tiết mát mẻ, độ ẩm cao

## 🌿 **CHUẨN BỊ CÀNH GIÂM**
- **Chọn cành:** 1 năm tuổi, có 3-4 mắt, khỏe mạnh
- **Cắt:** Nghiêng 45 độ, dài 15-20cm
- **Xử lý:** Nhúng IBA hoặc mật ong pha loãng 30 phút

## 🏺 **QUY TRÌNH GIÂM**
1️⃣ Cắt cành vào sáng sớm, ngâm nước ngay
2️⃣ Loại bỏ lá phía dưới, chỉ để 2-3 lá trên cùng
3️⃣ Cắm vào đất cát + perlite, độ sâu 2/3 chiều dài
4️⃣ Tưới ẩm, đậy túi nilon tạo ẩm
5️⃣ Đặt nơi sáng nhưng không nắng trực tiếp

## 📊 **TỶ LỆ THÀNH CÔNG**
- **Hồng cổ Hà Nội:** 98%
- **Hồng leo:** 95%
- **Hồng ngoại:** 90%

Hiện tại mình đã có cả vườn hồng từ vài cành giâm ban đầu! 😊`,
      tags: ['hoa-canh', 'companion-planting', 'beginner-friendly', 'seedling'],
      images: [
        'pictures/post/post-8-1-20250524T134500Z.png',
        'pictures/post/post-8-2-20250524T134500Z.png',
        'pictures/post/post-8-3-20250524T134500Z.png'
      ],
      createdAt: new Date('2025-05-24T13:45:00Z')
    },
    {
      gardenerId: gardeners[3]?.userId || gardeners[0].userId,
      title: 'Trồng dâu tây trong thùng xốp - Quả ngọt lịm sau 3 tháng!',
      content: `Ai bảo dâu tây khó trồng? Mình đã thành công với thùng xốp đơn giản! 🍓

## 📦 **SETUP THÙNG XỐP**
- **Thùng xốp:** 60x40x30cm, khoan lỗ thoát nước
- **Đất trồng:** 40% xơ dừa + 40% đất mùn + 20% perlite
- **Vị trí:** Ban công có nắng sáng, thoáng mát

## 🌱 **GIỐNG DÂU TÂY**
Chọn giống **Camarosa** - thích hợp khí hậu nhiệt đới, quả to, ngọt

## 🌸 **QUÁ TRÌNH PHÁT TRIỂN**
- **Tháng 1:** Trồng cây giống, thích nghi môi trường
- **Tháng 2:** Ra hoa trắng xinh, thụ phấn bằng bông
- **Tháng 3:** Quả đầu tiên chín đỏ, ngọt như kẹo!

## 💧 **CHĂM SÓC ĐẶC BIỆT**
- **Tưới:** Sáng 1 lần, giữ đất ẩm không úng
- **Bón phân:** NPK 15-5-20 mỗi 2 tuần
- **Phòng sâu:** Che lưới chống chim ăn quả

## 📊 **KẾT QUẢ THU HOẠCH**
- **Số quả/cây:** 15-20 quả/tháng
- **Trọng lượng:** 20-30g/quả
- **Độ ngọt:** Ngọt tự nhiên, thơm đặc trưng

Con nhỏ nhà mình thích lắm, mỗi sáng chạy ra hái dâu ăn sáng! 😄

Ai muốn thử trồng dâu tây thì inbox mình chia sẻ chi tiết nhé! 🍓`,
      tags: ['container-garden', 'harvest', 'beginner-friendly', 'organic'],
      images: [
        'pictures/post/post-9-1-20250523T100000Z.png',
        'pictures/post/post-9-2-20250523T100000Z.png'
      ],
      createdAt: new Date('2025-05-23T10:00:00Z')
    },
    {
      gardenerId: gardeners[4]?.userId || gardeners[0].userId,
      plantName: 'Ớt Chuông',
      plantGrowStage: 'Đậu quả',
      title: 'Ớt chuông 7 màu trên sân thượng - Vườn cầu vồng mini!',
      content: `Sân thượng nhà mình giờ như vườn cầu vồng với ớt chuông đủ màu! 🌈

## 🎨 **PALETTE MÀU SẮC**
- **Đỏ:** Sweet Red - ngọt, giòn
- **Vàng:** Golden Bell - thơm nức
- **Cam:** Orange Sunset - màu đẹp nhất
- **Tím:** Purple Beauty - độc đáo
- **Xanh:** Green Giant - to nhất
- **Trắng:** Snow White - hiếm có
- **Đen:** Black Pearl - lạ mắt

## 🏠 **SETUP SÂN THƯỢNG**
- **Chậu:** 7 chậu 40cm, xếp theo hình cầu vồng
- **Che nắng:** Lưới 70% vào mùa hè
- **Tưới:** Hệ thống nhỏ giọt tự động

## 🌡️ **ĐIỀU KIỆN THÀNH CÔNG**
- **Nhiệt độ:** 20-28°C (dùng lưới che điều chỉnh)
- **Ánh sáng:** 6-8 tiếng nắng/ngày
- **Độ ẩm:** 60-70%, tưới đều đặn

## 🥗 **ỨNG DỤNG ẨM THỰC**
- **Salad:** Mix 7 màu cực đẹp mắt
- **Nướng BBQ:** Ớt tím và đen rất lạ
- **Soup:** Ớt vàng cam có vị ngọt đặc biệt

## 📈 **NĂNG SUẤT THỰC TẾ**
Mỗi cây cho 8-12 quả/tháng, tổng cộng ~70 quả/tháng!

Hàng xóm ai cũng trầm trồ khen đẹp, nhiều người xin học cách trồng! 

Mọi người có muốn thử tạo vườn cầu vồng riêng không? 🌈`,
      tags: ['san-thuong', 'container-garden', 'harvest', 'nang-suat-cao'],
      images: [
        'pictures/post/post-10-1-20250522T140000Z.png',
        'pictures/post/post-10-2-20250522T140000Z.png',
        'pictures/post/post-10-3-20250522T140000Z.png'
      ],
      createdAt: new Date('2025-05-22T14:00:00Z')
    },
    {
      gardenerId: gardeners[0].userId,
      plantName: 'Cây Xanh Lá',
      plantGrowStage: 'Phát triển',
      title: 'DIY khay trồng rau thủy canh từ hộp nhựa - Chi phí chỉ 100k!',
      content: `Mình vừa tự chế thành công hệ thống thủy canh mini từ đồ cũ! 💧

## 📦 **VẬT LIỆU CẦN THIẾT**
- **Hộp nhựa trong:** 30x20x15cm (20k)
- **Ống bơm oxy:** Cho bể cá (30k)
- **Cốc nhựa nhỏ:** 12 cái (24k)
- **Xơ dừa + perlite:** (20k)
- **Dung dịch dinh dưỡng:** AB hydro (6k)

**Tổng chi phí:** 100k cho cả hệ thống!

## 🔧 **HƯỚNG DẪN CHỊ TẠO**
1️⃣ **Khoan lỗ:** 12 lỗ đường kính 5cm trên nắp hộp
2️⃣ **Lắp ống bơm:** Đặt đáy hộp, nối máy bơm mini
3️⃣ **Chuẩn bị cốc:** Khoan lỗ nhỏ, cho xơ dừa vào
4️⃣ **Pha dinh dưỡng:** AB hydro theo tỷ lệ 1:1000

## 🌱 **CÂY TRỒNG THÀNH CÔNG**
- **Xà lách:** Xanh tốt, giòn ngọt
- **Cải bó xôi:** Lá to, mềm mại
- **Rau muống:** Phát triển nhanh nhất
- **Húng quế:** Thơm đậm đà

## 📊 **SO SÁNH VỚI TRỒNG ĐẤT**
**Ưu điểm:**
✅ Sạch sẽ, không sâu bệnh
✅ Phát triển nhanh gấp 2 lần
✅ Tiết kiệm nước và phân bón
✅ Thu hoạch quanh năm

**Nhược điểm:**
❌ Cần điện để chạy bơm
❌ Phải theo dõi pH và EC
❌ Chi phí ban đầu cao hơn

## 🔬 **KINH NGHIỆM KỸ THUẬT**
- **pH:** Giữ ở 5.5-6.5 (dùng pH pen)
- **EC:** 1.2-1.8 (dùng EC meter)
- **Thay nước:** 2 tuần/lần hoàn toàn
- **Bổ sung:** Kiểm tra hàng ngày, thêm nước cất

## 💡 **MẸO HAY TỪ THỰC HÀNH**
- Dùng giấy bạc bọc hộp tránh rêu tảo
- Thêm 1-2 viên vitamin C vào nước
- Che nắng nhẹ cho rau lá vào mùa hè
- Bật bơm oxy 12 tiếng/ngày

Ai quan tâm thủy canh thì thử làm theo cách này nhé! Đơn giản mà hiệu quả! 🌿`,
      tags: ['hydroponic', 'urban-farming', 'beginner-friendly', 'tiet-kiem-nuoc'],
      images: [
        'pictures/post/post-11-1-20250521T090000Z.png',
        'pictures/post/post-11-2-20250521T090000Z.png'
      ],
      createdAt: new Date('2025-05-21T09:00:00Z')
    },
    {
      gardenerId: gardeners[1]?.userId || gardeners[0].userId,
      plantName: 'Hoa Súng',
      plantGrowStage: 'Nở hoa',
      title: 'Hoa súng mini trong chậu - Đẹp như tranh thủy mặc!',
      content: `Ước mơ có ao sen nhỏ đã thành hiện thực với chậu hoa súng! 🪷

## 🏺 **CHUẨN BỊ CHẬU TRỒNG**
- **Chậu:** Sứ không lỗ, đường kính 60cm, sâu 40cm
- **Đất:** Đất sét + phân chuồng (7:3)
- **Nước:** Cao 20cm, để lắng 3 ngày trước khi trồng

## 🌸 **GIỐNG HOA SÚNG**
Chọn giống **Nymphaea Aurora** - hoa nhỏ, thay đổi màu theo ngày:
- **Ngày 1:** Vàng nhạt
- **Ngày 2:** Cam đỏ
- **Ngày 3:** Đỏ thẫm

## 🌱 **QUÁ TRÌNH TRỒNG**
1️⃣ **Ngâm củ:** 2 ngày trong nước ấm
2️⃣ **Trồng:** Đặt củ ngang, lộ đầu chồi
3️⃣ **Đổ nước:** Từ từ, không làm vẩn đục
4️⃣ **Chờ đợi:** 2 tuần đầu lá nổi lên

## 🐠 **HỆ SINH THÁI MINI**
- **Cá:** 3 con cá bảy màu nhỏ
- **Ốc:** Ốc bươu vàng làm sạch rêu
- **Thực vật:** Bèo tây, lục bình mini

## 🌞 **CHĂM SÓC ĐẶC BIỆT**
- **Ánh sáng:** 6+ tiếng nắng trực tiếp
- **Nước:** Bổ sung khi bay hơi, không thay hoàn toàn
- **Phân:** Viên phân chậm tan cho cây thủy sinh

## 🎨 **VẺ ĐẸP TRONG TỪNG NGÀY**
**Buổi sáng:** Hoa nở từ từ theo ánh nắng
**Buổi trưa:** Nở rộ hoàn toàn, tỏa hương nhẹ
**Buổi chiều:** Cánh hoa khép lại dần
**Buổi tối:** Lá nổi yên bình trên mặt nước

## 💭 **CẢM NHẬN**
Ngồi ngắm hoa súng mỗi sáng với tách cà phê đã trở thành thói quen yêu thích. Tiếng nước róc rách, cá bơi lăng, hoa nhẹ nhàng nở - thật thanh bình!

Ai muốn có góc thiền trong nhà thì hoa súng là lựa chọn tuyệt vời! 🧘‍♀️`,
      tags: ['hoa-canh', 'trong-nha', 'aquaponic', 'advanced'],
      images: [
        'pictures/post/post-12-1-20250520T160000Z.png',
        'pictures/post/post-12-2-20250520T160000Z.png'
      ],
      createdAt: new Date('2025-05-20T16:00:00Z')
    },
    {
      gardenerId: gardeners[2]?.userId || gardeners[0].userId,
      title: 'Chế biến phân bón hữu cơ từ vỏ trái cây - Công thức bí mật!',
      content: `Chia sẻ công thức làm phân bón siêu mạnh từ vỏ trái cây! 🍌🥭

## 🍎 **NGUYÊN LIỆU CHÍNH**
- **Vỏ chuối:** 40% (giàu kali)
- **Vỏ cam chanh:** 30% (vitamin C, axit citric)
- **Vỏ xoài:** 20% (enzyme, chất xơ)
- **Vỏ táo:** 10% (pectin, axit malic)

## 🧪 **CÔNG THỨC Ủ MEN**
**Nguyên liệu phụ:**
- Nước vo gạo: 500ml
- Đường nâu: 50g
- Men nở: 1 gói
- Nước sạch: 1.5 lít

## 🔄 **QUY TRÌNH CHẾ BIẾN**
1️⃣ **Cắt nhỏ:** Vỏ trái cây thành miếng 1-2cm
2️⃣ **Trộn đường:** Rắc đường nâu đều, để 2 tiếng
3️⃣ **Thêm men:** Pha men nở với nước vo gạo ấm
4️⃣ **Ủ kín:** Chai nhựa có nắp, để 3-4 tuần
5️⃣ **Lọc:** Lấy phần nước trong, bỏ xác

## 📅 **LỊCH TRÌNH 30 NGÀY**
- **Tuần 1:** Sủi bọt mạnh, mùi chua nhẹ
- **Tuần 2:** Bọt giảm, mùi chuyển thành thơm
- **Tuần 3:** Màu nâu đậm, có mùi rượu nhẹ
- **Tuần 4:** Hoàn thành, mùi ngọt dịu

## 🌱 **CÁCH SỬ DỤNG**
- **Pha loãng:** 1:20 với nước (1 cup phân : 20 cup nước)
- **Tần suất:** 2 tuần/lần
- **Thời điểm:** Buổi chiều mát
- **Cây phù hợp:** Hoa quả, rau lá, cây cảnh

## 📊 **HIỆU QUẢ THỰC TẾ**
**Trước khi dùng:**
- Cây phát triển chậm
- Lá nhỏ, màu nhạt
- Ít hoa, ít quả

**Sau 1 tháng sử dụng:**
- Lá to, xanh đậm
- Ra hoa nhiều hơn 300%
- Quả to, ngọt hơn
- Cây khỏe, ít bệnh

## 💚 **LỢI ÍCH VƯỢT TRỘI**
✅ **Kinh tế:** Tiết kiệm 80% chi phí phân bón
✅ **Môi trường:** Tái chế rác thải hữu cơ
✅ **An toàn:** 100% tự nhiên, không độc hại
✅ **Hiệu quả:** Cây phát triển vượt mong đợi

## ⚠️ **LƯU Ý QUAN TRỌNG**
- Không dùng vỏ trái cây đã xịt thuốc trừ sâu
- Tránh để dưới nắng trực tiếp khi ủ
- Nếu có mùi hôi thối thì đã hỏng, làm lại
- Bảo quản nơi mát, dùng trong 6 tháng

Đây là công thức mình research và thử nghiệm 1 năm mới dám chia sẻ! Hiệu quả thật sự bất ngờ! 🌿`,
      tags: ['natural-fertilizer', 'eco-friendly', 'composting', 'organic'],
      images: [
        'pictures/post/post-13-1-20250519T110000Z.png',
        'pictures/post/post-13-2-20250519T110000Z.png'
      ],
      createdAt: new Date('2025-05-19T11:00:00Z')
    },
    {
      gardenerId: gardeners[3]?.userId || gardeners[0].userId,
      plantName: 'Rau Cải',
      plantGrowStage: 'Thu hoạch',
      title: 'Kỹ thuật trồng rau sạch theo mô hình Nhật Bản - Không hóa chất!',
      content: `Chia sẻ mô hình trồng rau học từ nông dân Nhật Bản! 🇯🇵

## 🏮 **TRIẾT LÝ NÔNG NGHIỆP NHẬT**
"Soil is life" - Đất là sự sống. Người Nhật tin rằng đất khỏe thì cây mới khỏe!

## 🌱 **CÁC NGUYÊN TẮC CỐT LÕI**

### 1. **EM BOKASHI - MEN VI SINH HIỆU QUẢ**
- **Thành phần:** 20 loại vi khuẩn có lợi
- **Cách dùng:** Rắc lên đất 1 tuần/lần
- **Hiệu quả:** Cải thiện cấu trúc đất, tăng sinh khối

### 2. **MULCHING - PHỦ ĐẤT TỰ NHIÊN**
- **Vật liệu:** Rơm rạ, lá khô, vỏ trấu
- **Lợi ích:** Giữ ẩm, chống cỏ dại, bón phân từ từ
- **Độ dày:** 5-7cm, để cách gốc cây 5cm

### 3. **COMPANION PLANTING - TRỒNG XEN**
- **Rau + hoa:** Cúc vạn thọ đuổi sâu
- **Rau + thảo mộc:** Húng quế chống nấm bệnh
- **Luân canh:** Đậu → Cải → Cà chua

## 📐 **THIẾT KẾ LUỐNG THEO CHUẨN NHẬT**
- **Chiều rộng:** 1.2m (tầm với của 2 tay)
- **Chiều cao:** 20cm (thoát nước tốt)
- **Lối đi:** 40cm giữa các luống
- **Hướng:** Bắc - Nam (đều ánh sáng)

## 🌿 **DANH SÁCH RAU TRỒNG THÀNH CÔNG**

### **Rau lá (Leafy Greens):**
- **Cải thìa Nhật:** Mềm, ngọt tự nhiên
- **Mizuna:** Lá xẻ đẹp, vị cay nhẹ
- **Komatsuna:** Chịu lạnh, dinh dưỡng cao

### **Rau củ (Root Vegetables):**
- **Củ cải trắng:** To như bắp chân
- **Cà rốt tím:** Màu độc đáo, ngọt đậm
- **Củ dền:** Đỏ tím, bổ dưỡng

## 🧬 **PHÒNG TRỪ SÂU BỆNH SINH HỌC**

### **Dung dịch phun tự nhiên:**
Nước tỏi: 5 củ/1 lít nước, ngâm 24h
Dầu neem: 5ml/1 lít nước + 1ml xà phòng
Baking soda: 5g/1 lít nước (chống nấm)
### **Bẫy côn trùng:**
- **Bẫy màu vàng:** Dính ruồi vàng, rệp
- **Bẫy bia:** Cho ốc sên, sên
- **Đèn UV:** Bắt sâu đêm

## 📊 **KẾT QUẢ SAU 6 THÁNG ÁP DỤNG**

**Chất lượng đất:**
- pH ổn định: 6.5-7.0
- Độ ẩm tối ưu: 60-70%
- Vi sinh vật tăng 500%

**Năng suất cây trồng:**
- Rau lá: Tăng 40% so với trước
- Màu sắc: Xanh đậm, bóng đẹp
- Hương vị: Ngọt tự nhiên, không đắng

**Sâu bệnh:**
- Giảm 90% so với trồng thông thường
- Không cần thuốc trừ sâu hóa học
- Cây khỏe mạnh, kháng bệnh tự nhiên

## 💰 **PHÂN TÍCH CHI PHÍ - LỢI NHUẬN**

**Đầu tư ban đầu (10m²):**
- Men EM Bokashi: 200,000đ
- Vật liệu mulch: 100,000đ  
- Giống cây Nhật: 300,000đ
- Dụng cụ: 200,000đ
**Tổng:** 800,000đ

**Thu nhập hàng tháng:**
- Rau sạch bán: 1,500,000đ
- Tiết kiệm mua rau: 500,000đ
**Tổng:** 2,000,000đ

**ROI:** Hoàn vốn sau 4 tháng!

## 🎯 **BƯỚC TIẾP THEO**
Tháng tới mình sẽ:
- Mở rộng thêm 20m² nữa
- Thử nghiệm kỹ thuật grafting (ghép cây)
- Xuất khẩu rau sạch sang Nhật (ước mơ lớn! 😄)

Ai quan tâm đến nông nghiệp sạch thì cùng trao đổi nhé! Mình sẵn sàng chia sẻ kinh nghiệm! 🌱`,
      tags: ['organic', 'advanced', 'sustainable', 'disease-prevention'],
      images: [
        'pictures/post/post-14-1-20250518T130000Z.png',
        'pictures/post/post-14-2-20250518T130000Z.png',
        'pictures/post/post-14-3-20250518T130000Z.png'
      ],
      createdAt: new Date('2025-05-18T13:00:00Z')
    },
    {
      gardenerId: gardeners[4]?.userId || gardeners[0].userId,
      plantName: 'Hoa Đồng Tiền',
      plantGrowStage: 'Nở rộ',
      title: 'Hoa đồng tiền từ hạt giống - Bí quyết nở hoa quanh năm!',
      content: `Hoa đồng tiền nhà mình nở quanh năm không nghỉ! Chia sẻ bí quyết nhé! 🌼

## 🌱 **GIỐNG HOA VÀ GIEO HẠT**

### **Giống đã thử thành công:**
- **Calendula Orange:** Cam rực rỡ, hoa to
- **Calendula Yellow:** Vàng tươi, nở nhiều
- **Calendula Mix:** Đủ màu, đẹp mắt
- **Calendula Dwarf:** Thấp, phù hợp chậu

### **Kỹ thuật gieo hạt:**
- **Thời điểm:** Quanh năm (tránh mùa mưa nhiều)
- **Xử lý hạt:** Ngâm nước ấm 2 tiếng
- **Gieo:** Khay xốp, đất mịn, che báo
- **Nảy mầm:** 5-7 ngày ở 20-25°C

## 🏡 **SETUP TRỒNG HOA**

### **Vị trí lý tưởng:**
- **Ánh sáng:** 6+ tiếng nắng trực tiếp
- **Gió:** Thoáng mát, không quá mạnh
- **Không gian:** Cách nhau 20-30cm

### **Chậu và đất:**
- **Chậu:** Đường kính 25cm, cao 20cm
- **Đất:** 40% đất vườn + 40% xơ dừa + 20% phân hữu cơ
- **Thoát nước:** Lót sỏi 3cm đáy chậu

## 🌸 **BÍ QUYẾT NỞ HOA LIÊN TỤC**

### **Kỹ thuật "tỉa ngọn sớm":**
Khi cây cao 10cm, cắt ngọn để ra nhiều nhánh
→ Từ 1 cây thành bụi 10-15 nhánh hoa!

### **Thu hoạch thông minh:**
- **Cắt hoa sáng sớm:** Khi 80% cánh nở
- **Để lại 2-3 mắt:** Để ra hoa tiếp
- **Tần suất:** 3-4 ngày cắt 1 lần

### **Bón phân kích hoa:**
- **NPK 15-5-20:** 2 tuần/lần (giàu kali)
- **Phân cá ủ:** 1 tháng/lần
- **Canxi:** Vỏ trứng nghiền rắc gốc

## 🎨 **ỨNG DỤNG HOA ĐỒNG TIỀN**

### **Trang trí nhà:**
- **Bình hoa:** Cắt cành dài, cắm bình
- **Vòng hoa:** Đan thành vòng tròn đẹp
- **Sấy khô:** Treo ngược, bảo quản lâu

### **Ẩm thực và y học:**
- **Trà hoa:** Sấy khô pha trà detox
- **Nấu ăn:** Cánh hoa ăn được, trang trí món
- **Thuốc nam:** Chữa viêm, khử độc

### **Làm đẹp tự nhiên:**
- **Nước hoa hồng:** Đun sôi với nước cất
- **Mặt nạ:** Nghiền cánh hoa + mật ong
- **Dầu massage:** Ngâm trong dầu oliu

## 📅 **LỊCH CHĂM SÓC HÀNG TUẦN**

**Thứ 2:** Kiểm tra sâu bệnh, tưới nước
**Thứ 4:** Bón phân lỏng NPK loãng
**Thứ 6:** Cắt hoa héo, tỉa lá già
**Chủ nhật:** Đảo trộn đất, bổ sung mulch

## 🐛 **PHÒNG TRỪ SÂU BỆNH**

### **Sâu hại thường gặp:**
- **Rệp xanh:** Xịt nước xà phòng
- **Sâu tơ:** Thu bắt thủ công buổi sáng
- **Ốc sên:** Rắc vỏ trứng nghiền quanh gốc

### **Bệnh cây:**
- **Nấm đốm lá:** Xịt baking soda 0.5%
- **Thối rễ:** Cải thiện thoát nước
- **Héo xanh:** Thay đất mới, khử trùng

## 📊 **THÀNH TÍCH SAU 1 NĂM**

**Sản lượng hoa:**
- **Hoa cắt/tháng:** 150-200 bông
- **Thời gian nở:** 8-10 ngày/bông
- **Màu sắc:** 5 màu khác nhau

**Chi phí - Lợi nhuận:**
- **Đầu tư:** 200,000đ (hạt giống, đất, chậu)
- **Giá trị hoa:** 2,000,000đ (nếu bán 10,000đ/bông)
- **Lợi nhuận:** 1,800,000đ (ROI 900%!)

## 🌟 **CẢM NHẬN CÁ NHÂN**
Hoa đồng tiền là loài hoa "biết ơn" nhất mình từng trồng! Chăm sóc đơn giản mà cho hoa quanh năm. Mỗi sáng thức dậy thấy những bông hoa vàng cam rực rỡ là vui cả ngày!

Đặc biệt, mùi thơm nhẹ nhàng của hoa làm khu vườn thêm sinh động. Nhiều bạn bè đến chơi đều xin hạt giống về trồng!

Ai muốn có khu vườn đầy màu sắc mà không tốn công chăm sóc thì hoa đồng tiền là lựa chọn số 1! 🌻`,
      tags: ['hoa-canh', 'beginner-friendly', 'harvest', 'natural-fertilizer'],
      images: [
        'pictures/post/post-15-1-20250517T150000Z.png',
        'pictures/post/post-15-2-20250517T150000Z.png'
      ],
      createdAt: new Date('2025-05-17T15:00:00Z')
    },
    {
      gardenerId: gardeners[0].userId,
      title: 'Xây dựng hệ thống aquaponics mini - Cá và rau cùng phát triển!',
      content: `Dự án aquaponics đầu tiên của mình đã thành công rực rỡ! 🐟🌱

## 🏗️ **THIẾT KẾ HỆ THỐNG**

### **Nguyên lý hoạt động:**
Cá thải → Vi khuẩn phân hủy → Đạm NO3 → Rau hấp thu → Nước sạch → Về bể cá

### **Cấu trúc 3 tầng:**
1. **Tầng trên:** Khay trồng rau (120x80cm)
2. **Tầng giữa:** Bể lọc sinh học (50L)
3. **Tầng dưới:** Bể cá chính (200L)

## 🐠 **CHỌN CÁ VÀ MẬT ĐỘ**

### **Loài cá thích hợp:**
- **Cá rô phi:** Dễ nuôi, chịu đựng tốt
- **Cá trắm cỏ:** Ăn cỏ, không cần thức ăn nhiều
- **Cá chép:** Hardy, phát triển nhanh

### **Mật độ nuôi:**
- **Bể 200L:** 15-20 con cá trung bình
- **Trọng lượng:** 1kg cá/100L nước
- **Kích thước:** 15-20cm/con

## 🌿 **RAU TRỒNG THÀNH CÔNG**

### **Rau lá nước:**
- **Rau muống:** Phát triển nhanh nhất
- **Cải bó xôi:** Lá to, xanh đậm
- **Xà lách:** Giòn, ngọt tự nhiên

### **Thảo mộc:**
- **Húng quế:** Thơm đậm đà
- **Bạc hà:** Sum sê, hái hoài không hết
- **Rau răm:** Cay nồng đặc trưng

## ⚙️ **THIẾT BỊ VÀ CHI PHÍ**

### **Máy bơm và lọc:**
- **Bơm chìm 25W:** 350,000đ
- **Máy sủi oxy:** 200,000đ
- **Vật liệu lọc sinh học:** 150,000đ

### **Khay trồng rau:**
- **Ống PVC 110mm:** 300,000đ
- **Net pot và xơ dừa:** 100,000đ
- **Khung sắt:** 400,000đ

**Tổng chi phí:** 1,500,000đ

## 🔬 **KIỂM SOÁT CHẤT LƯỢNG NƯỚC**

### **Thông số quan trọng:**
- **pH:** 6.8-7.2 (cân bằng cho cả cá và rau)
- **Ammonia (NH3):** <0.5ppm
- **Nitrite (NO2):** <0.1ppm
- **Nitrate (NO3):** 20-40ppm

### **Test kit cần thiết:**
- **pH meter:** Đo hàng ngày
- **TDS meter:** Kiểm tra tổng chất rắn
- **Test strips:** NH3, NO2, NO3 hàng tuần

// ... phần trước đã có ...

## 📈 **TIẾN TRÌNH 3 THÁNG ĐẦU**

### **Tháng 1 - Khởi động:**
- **Tuần 1-2:** Cycling hệ thống, tạo vi khuẩn có lợi
- **Tuần 3-4:** Thả cá, bắt đầu cho ăn nhẹ

### **Tháng 2 - Ổn định:**
- **Nitrate tăng:** Đủ dinh dưỡng cho rau
- **Cá khỏe mạnh:** Ăn tốt, không bệnh
- **Rau bắt đầu xanh:** Lá non nhú ra

### **Tháng 3 - Thu hoạch:**
- **Rau muống:** 2kg/tháng
- **Cá to ra:** Trung bình 300g/con
- **Hệ thống ổn định:** Ít cần can thiệp

## 💰 **HIỆU QUẢ KINH TẾ**
**Thu nhập/tháng:**
- Rau sạch: 500,000đ
- Cá tươi: 300,000đ
**Tổng:** 800,000đ

**Chi phí vận hành:** 100,000đ (điện, thức ăn cá)
**Lợi nhuận:** 700,000đ/tháng

Ai quan tâm đến aquaponics thì inbox mình nhé! 🌊`,
      tags: ['aquaponic', 'advanced', 'sustainable', 'nang-suat-cao'],
      images: [
        'pictures/post/post-16-1-20250516T100000Z.png',
        'pictures/post/post-16-2-20250516T100000Z.png',
        'pictures/post/post-16-3-20250516T100000Z.png'
      ],
      createdAt: new Date('2025-05-16T10:00:00Z')
    },
    {
      gardenerId: gardeners[1]?.userId || gardeners[0].userId,
      plantName: 'Cây Ổi',
      plantGrowStage: 'Ra quả',
      title: 'Cây ổi lùn Thái Lan trong chậu - 8 tháng đã có quả!',
      content: `Ai bảo ổi phải trồng đất mới có quả? Cây ổi chậu nhà mình đã đậu quả lúc lỉu! 🥭

## 🌱 **CHỌN GIỐNG VÀ TRỒNG**

### **Giống ổi lùn Thái Lan:**
- **Đặc điểm:** Cao 1-1.5m, quả to 300-500g
- **Ưu điểm:** Ra quả sớm, ngọt, ít hạt
- **Nguồn gốc:** Mua cây giống 2 năm tuổi

### **Chậu và đất:**
- **Chậu:** 80cm đường kính, 60cm sâu
- **Đất:** 40% đất vườn + 40% phân chuồng + 20% cát sông
- **Thoát nước:** Lót sỏi 10cm, lỗ thoát nhiều

## 🌸 **QUÁ TRÌNH RA HOA VÀ ĐẬU QUẢ**

### **Giai đoạn thích nghi (tháng 1-2):**
- Cây hơi shock sau khi trồng
- Tỉa bớt lá để giảm thoát hơi nước
- Tưới nhẹ, tránh úng nước

### **Giai đoạn phát triển (tháng 3-5):**
- Cây ra lá mới xanh tốt
- Bắt đầu có nhánh phụ
- Định hình tán cây bằng cách tỉa

### **Giai đoạn ra hoa (tháng 6-7):**
- Hoa nhỏ màu trắng, thơm nhẹ
- Ra hoa từng đợt, 2-3 tuần/đợt
- Thụ phấn tự nhiên, không cần can thiệp

### **Giai đoạn đậu quả (tháng 8):**
- Quả non xanh, to dần từng ngày
- Tỉa bớt quả yếu, để lại 2-3 quả/cành
- Bọc túi ni lông chống sâu đục quả

## 🥗 **DINH DƯỠNG VÀ BÓN PHÂN**

### **Phân gốc (3 tháng/lần):**
- **Phân chuồng:** 2kg/chậu
- **Phân NPK 16-16-8:** 100g/chậu
- **Vôi bột:** 50g (cung cấp canxi)

### **Phân tưới (2 tuần/lần):**
- **NPK 20-20-20:** 5g/10L nước
- **Phân hữu cơ lỏng:** Tự ủ từ rau củ
- **Vitamin B1:** 1 viên/5L nước

### **Phân lá (1 tuần/lần):**
- **NPK 15-5-20:** 3g/10L nước
- **Canxi nitrat:** 2g/10L (chống nứt quả)
- **Phun buổi chiều mát:** Tránh cháy lá

## 🌞 **CHĂM SÓC ĐẶC BIỆT**

### **Ánh sáng:**
- **Cần:** 6-8 tiếng nắng trực tiếp/ngày
- **Vị trí:** Sân thượng hoặc sân trước
- **Mùa đông:** Di chuyển tránh gió lạnh

### **Tưới nước:**
- **Mùa khô:** 2 lần/ngày (sáng, chiều)
- **Mùa mưa:** Kiểm tra độ ẩm đất
- **Lượng nước:** Tưới đến khi nước chảy ra lỗ thoát

### **Tỉa cành:**
- **Mục đích:** Tạo tán cây đẹp, thông thoáng
- **Thời điểm:** Sau thu hoạch
- **Cách tỉa:** Cắt cành chéo, cành yếu, cành sâu bệnh

## 🐛 **PHÒNG TRỪ SÂU BỆNH**

### **Sâu hại chính:**
1. **Sâu đục quả ổi:**
   - **Triệu chứng:** Lỗ nhỏ trên quả
   - **Phòng:** Bọc túi ni lông từ khi quả bé
   - **Trị:** BT (Bacillus thuringiensis)

2. **Rệp sáp:**
   - **Triệu chứng:** Đốm trắng trên lá và cành
   - **Phòng:** Thông thoáng, không ẩm ướt
   - **Trị:** Dầu neem + nước xà phòng

### **Bệnh nấm:**
1. **Bệnh đốm lá:**
   - **Nguyên nhân:** Độ ẩm cao, thông thoáng kém
   - **Phòng:** Tỉa cành tạo thông thoáng
   - **Trị:** Baking soda 0.5% xịt lá

## 📊 **THÀNH QUẢ THU HOẠCH**

### **Đợt đầu tiên (tháng 8):**
- **Số quả:** 8 quả/cây
- **Trọng lượng:** 250-350g/quả
- **Tổng khối lượng:** 2.5kg

### **Chất lượng quả:**
- **Vỏ:** Xanh nhạt, mịn màng
- **Ruột:** Trắng hồng, giòn ngọt
- **Hạt:** Ít, mềm, ăn được
- **Mùi:** Thơm đặc trưng

### **So sánh với mua ngoài:**
- **Ngọt hơn:** Không xử lý hóa chất
- **Giòn hơn:** Thu hoạch đúng độ chín
- **An toàn:** Biết rõ nguồn gốc

## 💚 **LỢI ÍCH VƯỢT TRỘI**

### **Kinh tế:**
- **Tiết kiệm:** 300,000đ/năm tiền mua ổi
- **Thu nhập:** Có thể bán cho hàng xóm
- **Giá trị:** Cây cảnh đẹp cho sân vườn

### **Sức khỏe:**
- **Vitamin C:** Cao gấp 5 lần cam
- **Chất xơ:** Tốt cho tiêu hóa
- **Không hóa chất:** An toàn tuyệt đối

### **Tinh thần:**
- **Thành tựu:** Từ cây con thành cây cho quả
- **Kiên nhẫn:** 8 tháng chờ đợi có ý nghĩa
- **Chia sẻ:** Cho hàng xóm nếm thử

## 🔮 **KẾ HOẠCH TƯƠNG LAI**

### **Mở rộng:**
- Trồng thêm 2 cây giống khác (ổi nữ hoàng, ổi ruby)
- Thử nghiệm kỹ thuật ghép để có nhiều giống trên 1 cây

### **Cải tiến:**
- Lắp hệ thống tưới nhỏ giọt
- Học kỹ thuật tạo dáng cây cảnh

Ai muốn trồng cây ăn quả trong chậu thì ổi lùn là lựa chọn tuyệt vời! 🌳`,
      tags: ['container-garden', 'harvest', 'advanced', 'plant-care'],
      images: [
        'pictures/post/post-17-1-20250515T140000Z.png',
        'pictures/post/post-17-2-20250515T140000Z.png'
      ],
      createdAt: new Date('2025-05-15T14:00:00Z')
    },
    {
      gardenerId: gardeners[2]?.userId || gardeners[0].userId,
      title: 'Kỹ thuật trồng nấm tại nhà - Thu hoạch 2kg nấm/tháng!',
      content: `Từ phòng tối thành trang trại nấm mini! Chia sẻ toàn bộ quy trình! 🍄

## 🏠 **SETUP PHÒNG TRỒNG NẤM**

### **Vị trí và không gian:**
- **Phòng:** Góc tối trong nhà, ít ánh sáng
- **Kích thước:** 2x2x2.5m
- **Thông thoáng:** Quạt hút nhỏ để lưu thông không khí
- **Nhiệt độ:** 22-26°C ổn định

### **Thiết bị cần thiết:**
- **Kệ inox 4 tầng:** 800,000đ
- **Máy phun sương:** 300,000đ
- **Đèn LED yếu:** 100,000đ
- **Nhiệt ẩm kế:** 50,000đ
- **Túi ni lông:** 20,000đ

**Tổng đầu tư:** 1,270,000đ

## 🍄 **CÁC LOẠI NẤM TRỒNG THÀNH CÔNG**

### **1. Nấm Pleurotus (Nấm Bào Ngư):**
- **Ưu điểm:** Dễ trồng nhất, chịu đựng tốt
- **Thời gian:** 15-20 ngày có nấm
- **Năng suất:** 1kg/bịch
- **Chu kỳ:** 3-4 đợt thu hoạch/bịch

### **2. Nấm Shiitake:**
- **Đặc điểm:** Có giá trị dinh dưỡng cao
- **Thời gian:** 25-30 ngày
- **Năng suất:** 600-800g/bịch
- **Giá bán:** 80,000đ/kg

### **3. Nấm Kim Châm:**
- **Hình dáng:** Thân dài, mũ nhỏ màu trắng
- **Thời gian:** 18-22 ngày
- **Đặc biệt:** Giòn, ngọt tự nhiên
- **Ứng dụng:** Lẩu, soup, xào

## 🌾 **CHUẨN BỊ GIỐNG VÀ MÔI TRƯỜNG**

### **Mua giống nấm:**
- **Nguồn:** Trung tâm nông nghiệp công nghệ cao
- **Dạng:** Bịch giống đã tiêm, sẵn sàng ra nấm
- **Giá:** 15,000-25,000đ/bịch
- **Số lượng:** Bắt đầu với 10 bịch

### **Xử lý giống:**
- **Khử trùng:** Lau bằng cồn 70%
- **Tạo lỗ:** Cắt chữ thập 2x2cm
- **Vị trí:** Đặt lỗ hướng xuống để nước không vào

## 💧 **HỆ THỐNG PHUN SƯƠNG**

### **Thiết lập độ ẩm:**
- **Độ ẩm cần:** 85-90%
- **Tần suất phun:** 4-5 lần/ngày, mỗi lần 2-3 phút
- **Timer:** Lập trình 6h, 10h, 14h, 18h, 22h

### **Chất lượng nước:**
- **Loại nước:** Nước sạch, không chứa clo
- **Xử lý:** Để nước máy qua đêm hoặc dùng nước lọc
- **Nhiệt độ:** Nước phun ở nhiệt độ phòng

## 🌡️ **KIỂM SOÁT NHIỆT ĐỘ - ẨM ĐỘ**

### **Mùa nóng (>30°C):**
- **Giải pháp:** Quạt hút + máy làm mát
- **Tăng phun sương:** 6-7 lần/ngày
- **Che nắng:** Màn chắn nếu có ánh sáng trực tiếp

### **Mùa lạnh (<20°C):**
- **Sưởi ấm:** Bóng đèn 25W
- **Giảm thông gió:** Đóng bớt cửa ra vào
- **Giữ ẩm:** Phun sương nhiều hơn

## 📅 **QUY TRÌNH 30 NGÀY**

### **Ngày 1-5: Thích nghi**
- Đặt bịch giống vào kệ
- Phun sương đều đặn
- Kiểm tra nhiệt độ, độ ẩm

### **Ngày 6-10: Phát triển**
- Xuất hiện nấm nhỏ màu trắng
- Tăng cường phun sương
- Giảm ánh sáng xuống mức tối thiểu

### **Ngày 11-15: Ra nấm**
- Nấm lớn nhanh từng ngày
- Bắt đầu phun sương có định hướng
- Chuẩn bị thu hoạch

### **Ngày 16-20: Thu hoạch đợt 1**
- Cắt nấm khi mũ chưa xòe hoàn toàn
- Dọn vệ sinh gốc nấm
- Ngừng phun sương 2-3 ngày

### **Ngày 21-30: Chu kỳ 2**
- Nấm đợt 2 bắt đầu nhú ra
- Lặp lại quy trình chăm sóc

## 🔪 **KỸ THUẬT THU HOẠCH**

### **Thời điểm thu hoạch:**
- **Nấm bào ngư:** Khi mép nấm còn hơi cuộn
- **Nấm shiitake:** Khi mũ nở 70-80%
- **Nấm kim châm:** Khi cao 10-12cm

### **Cách cắt:**
- **Dụng cụ:** Dao sắc, khử trùng
- **Vị trí:** Cắt sát gốc, để lại chân nấm 1cm
- **Thời gian:** Buổi sáng sớm khi nấm còn tươi

### **Bảo quản sau thu:**
- **Ngay lập tức:** Cho vào túi ni lông, tủ lạnh
- **Ngắn hạn:** 3-5 ngày trong tủ lạnh
- **Dài hạn:** Sấy khô hoặc đông lạnh

## 📊 **THỐNG KÊ SẢN LƯỢNG VÀ LỢI NHUẬN**

### **Năng suất thực tế/tháng:**
- **Nấm bào ngư:** 1.2kg
- **Nấm shiitake:** 600g
- **Nấm kim châm:** 200g
**Tổng:** 2kg/tháng

### **Doanh thu:**
- **Bán:** 1.5kg x 40,000đ = 600,000đ
- **Tiêu dùng:** 0.5kg x 40,000đ = 200,000đ
**Tổng giá trị:** 800,000đ

### **Chi phí vận hành:**
- **Giống nấm:** 200,000đ
- **Điện nước:** 50,000đ
- **Vật tư:** 30,000đ
**Tổng chi phí:** 280,000đ

**Lợi nhuận:** 520,000đ/tháng

## 🍽️ **MÓN ĂN TỪ NẤM TỰ TRỒNG**

### **Nấm xào tỏi:**
Nấm bào ngư + tỏi băm + dầu ăn + nước mắm

### **Canh nấm kim châm:**
Thích hợp nấu canh chua, lẩu thái

### **Nấm shiitake nướng:**
Ướp với miso paste, nướng than hoa

## ⚠️ **LƯU Ý AN TOÀN**

### **Vệ sinh:**
- Rửa tay trước khi vào phòng nấm
- Khử trùng dụng cụ thường xuyên
- Không để côn trùng vào phòng

### **Sức khỏe:**
- Đeo khẩu trang khi thu hoạch
- Thông thoáng phòng trồng
- Không ăn nấm lạ, không rõ nguồn gốc

Trồng nấm tại nhà vừa có thu nhập vừa đảm bảo thực phẩm sạch cho gia đình! 🍄💚`,
      tags: ['indoor-garden', 'advanced', 'harvest', 'sustainable'],
      images: [
        'pictures/post/post-18-1-20250514T110000Z.png',
        'pictures/post/post-18-2-20250514T110000Z.png',
        'pictures/post/post-18-3-20250514T110000Z.png'
      ],
      createdAt: new Date('2025-05-14T11:00:00Z')
    },
    {
      gardenerId: gardeners[3]?.userId || gardeners[0].userId,
      plantName: 'Cây Bơ',
      plantGrowStage: 'Cây con',
      title: 'Trồng cây bơ từ hạt - Từ quả ăn thừa thành cây xanh tượng!',
      content: `Ai ngờ từ hạt bơ bỏ đi lại thành cây cảnh đẹp như thế này! 🥑

## 🌱 **HÀNH TRÌNH TỪ HẠT ĐẾN CÂY**

### **Chọn hạt và chuẩn bị:**
- **Nguồn hạt:** Quả bơ Booth 7 ăn thừa
- **Chọn hạt:** To, đầy đặn, không nứt vỡ
- **Làm sạch:** Rửa sạch thịt quả còn sót lại
- **Lột vỏ:** Bóc lớp vỏ nâu bên ngoài (không bắt buộc)

### **Phương pháp nảy mầm trong nước:**
Đây là cách truyền thống, dễ quan sát nhất!

**Dụng cụ cần:**
- 3-4 cây tăm
- Cốc thủy tinh trong suốt
- Nước sạch

**Cách làm:**
1. Cắm 3 cây tăm vào hạt ở vị trí giữa
2. Đặt hạt lên miệng cốc, đầu nhọn hướng lên
3. Đổ nước ngập 1/3 hạt (phần đáy tròn)
4. Đặt nơi sáng, tránh nắng trực tiếp
5. Thay nước 2-3 ngày/lần

## 📅 **TIMELINE PHÁT TRIỂN**

### **Tuần 1-2: Hạt nứt**
- Ngày 5-7: Hạt bắt đầu nứt từ đỉnh xuống
- Ngày 10-14: Khe nứt rộng ra rõ rệt
- **Lưu ý:** Một số hạt nứt sớm sau 3 ngày

### **Tuần 3-4: Rễ cái xuất hiện**
- Ngày 15-20: Rễ chính màu trắng nhú ra từ đáy
- Ngày 21-28: Rễ dài 5-10cm, có rễ phụ
- **Quan sát:** Rễ khỏe mạnh, màu trắng hồng

### **Tuần 5-6: Chồi lên**
- Ngày 29-35: Chồi xanh nhú ra từ đỉnh hạt
- Ngày 36-42: Thân cao 10-15cm, có lá đầu tiên
- **Thời điểm:** Chuyển sang trồng đất

## 🏺 **CHUYỂN SANG TRỒNG ĐẤT**

### **Chuẩn bị chậu và đất:**
- **Chậu:** Đường kính 20cm, cao 25cm có lỗ thoát nước
- **Đất trộn:** 50% đất vườn + 30% xơ dừa + 20% phân hữu cơ
- **Thoát nước:** Lót sỏi 3cm đáy chậu

### **Kỹ thuật trồng:**
- **Độ sâu:** Chỉ chôn 2/3 hạt, để lộ phần đỉnh
- **Vị trí:** Thân nhỏ thẳng đứng, không nghiêng
- **Tưới nước:** Nhẹ nhàng quanh hạt, tránh làm lung lay

## 🌿 **CHĂM SÓC CÂY CON**

### **Ánh sáng:**
- **Giai đoạn đầu:** Ánh sáng gián tiếp, tránh nắng gắt
- **Sau 1 tháng:** 4-6 tiếng nắng nhẹ/ngày
- **Vị trí:** Ban công hướng Đông hoặc trong nhà sáng

### **Tưới nước:**
- **Tần suất:** 2-3 ngày/lần, kiểm tra độ ẩm đất
- **Lượng nước:** Vừa đủ ẩm, không úng nước
- **Thời điểm:** Sáng sớm hoặc chiều mát

### **Bón phân:**
- **Tuần đầu:** Chỉ dùng nước sạch
- **Sau 2 tuần:** NPK 16-16-8 loãng (1g/1L nước)
- **Tần suất:** 2 tuần/lần, không bón quá đậm

## 🍃 **TỈNH CẢY TẠO DÁNG**

### **Tỉa ngọn lần đầu:**
- **Thời điểm:** Khi cây cao 30cm
- **Vị trí:** Cắt ngọn, để lại 20cm
- **Mục đích:** Kích thích ra nhánh bên

### **Tỉa tạo dáng:**
- **Nguyên tắc:** Giữ 2-3 nhánh chính
- **Loại bỏ:** Cành yếu, cành chéo nhau
- **Thời điểm:** Cuối đông, đầu xuân

### **Định hướng phát triển:**
- **Cây cảnh:** Tỉa thành dáng bụi tròn
- **Cây ăn quả:** Để tự nhiên, ít tỉa
- **Bonsai:** Uốn cong, cắt lá tạo dáng

## 🐛 **SÂU BỆNH VÀ CÁCH XỬ LÝ**

### **Sâu hại thường gặp:**
1. **Rệp xanh:**
   - **Triệu chứng:** Lá cuộn, dính nhờn
   - **Xử lý:** Nước xà phòng hoặc neem oil

2. **Nhện đỏ:**
   - **Triệu chứng:** Lá có màng mỏng, đốm vàng
   - **Xử lý:** Tăng độ ẩm, phun nước thường xuyên

### **Bệnh nấm:**
1. **Thối rễ:**
   - **Nguyên nhân:** Tưới quá nhiều nước
   - **Xử lý:** Giảm tưới, cải thiện thoát nước

2. **Đốm lá:**
   - **Triệu chứng:** Đốm nâu trên lá
   - **Xử lý:** Baking soda 0.5% xịt lá

## 📊 **THÀNH QUẢ SAU 6 THÁNG**

### **Kích thước cây:**
- **Chiều cao:** 80cm (đã tỉa ngọn 2 lần)
- **Số nhánh:** 4 nhánh chính
- **Lá:** 30-40 lá lớn, xanh đậm

### **Giá trị thẩm mỹ:**
- **Hạt:** Vẫn hiện hữu, như một chậu cảnh độc đáo
- **Thân:** Thẳng, mạnh mẽ
- **Lá:** To, bóng, màu xanh đẹp mắt

### **Chi phí và lợi ích:**
- **Chi phí:** 50,000đ (chậu + đất + phân)
- **Giá trị:** Cây cảnh tương đương 200,000đ
- **Lợi ích:** Lọc không khí, trang trí nhà

## 🌟 **NHỮNG ĐIỀU THÚ VỊ VỀ CÂY BƠ**

### **Đặc điểm sinh học:**
- **Tuổi thọ:** Có thể sống hàng trăm năm
- **Ra quả:** Cần 3-7 năm (tùy giống và điều kiện)
- **Thụ phấn:** Cần 2 cây khác giống để có quả

### **Ý nghĩa phong thủy:**
- **Màu xanh:** Mang lại sự bình an, thịnh vượng
- **Lá to:** Tượng trưng cho sự sung túc
- **Vị trí:** Phù hợp đặt góc đông nam của nhà

## 🔮 **KẾ HOẠCH PHÁT TRIỂN**

### **6 tháng tới:**
- Chuyển chậu lớn hơn (40cm)
- Tiếp tục tỉa tạo dáng
- Thử nghiệm bonsai với 1 cây

### **Dài hạn:**
- Trồng thêm 2-3 cây khác giống
- Học kỹ thuật ghép để có quả sớm
- Chia sẻ kinh nghiệm cho cộng đồng

Từ một hạt bơ "rác" thành cây xanh tuyệt đẹp! Ai cũng có thể làm được! 🌱💚`,
      tags: ['seedling', 'container-garden', 'beginner-friendly', 'plant-care'],
      images: [
        'pictures/post/post-19-1-20250513T160000Z.png',
        'pictures/post/post-19-2-20250513T160000Z.png'
      ],
      createdAt: new Date('2025-05-13T16:00:00Z')
    },
    {
      gardenerId: gardeners[4]?.userId || gardeners[0].userId,
      title: 'Vườn dọc tự chế từ pallet gỗ - 50 cây trong 2m2!',
      content: `Biến tường trống thành vườn xanh với chi phí chỉ 300k! 🌿

## 🏗️ **THIẾT KẾ VƯỜN DỌCI**

### **Nguyên liệu chính:**
- **Pallet gỗ cũ:** 2 tấm (100,000đ)
- **Vải địa kỹ thuật:** 5m (50,000đ)
- **Đất trồng:** 100L (80,000đ)
- **Ống nhỏ giọt:** 10m (30,000đ)
- **Vít, đinh:** 40,000đ

**Tổng chi phí:** 300,000đ

### **Kích thước và cấu trúc:**
- **Chiều cao:** 1.8m
- **Chiều rộng:** 1.2m
- **Số túi trồng:** 25 túi (2 mặt pallet)
- **Khoảng cách:** 20cm giữa các túi

## 🔨 **QUY TRÌNH CHẾ TẠO**

### **Bước 1: Chuẩn bị pallet**
- **Làm sạch:** Cọ rửa, để khô hoàn toàn
- **Xử lý gỗ:** Sơn dầu tự nhiên chống mối
- **Gia cố:** Vít thêm thanh ngang để chắc chắn

### **Bước 2: Tạo túi trồng**
- **Cắt vải địa:** Thành các miếng 30x25cm
- **May túi:** Để 3 mặt, 1 mặt để lỗ thoát nước
- **Gắn vào pallet:** Dùng kẹp inox hoặc dây thép

### **Bước 3: Hệ thống tưới**
- **Ống chính:** Chạy dọc theo đỉnh pallet
- **Ống phụ:** Nhỏ giọt đến từng túi
- **Timer:** Tưới tự động 2 lần/ngày

### **Bước 4: Lắp đặt**
- **Vị trí:** Tường hướng Đông hoặc Đông Nam
- **Cố định:** Bulông thép vào tường
- **Độ nghiêng:** Nghiêng 15 độ để thoát nước

## 🌱 **CHỌN CÂY VÀ BỐ TRÍ**

### **Tầng trên (ánh sáng nhiều):**
- **Rau thơm:** Húng quế, bạc hà, tía tô
- **Rau gia vị:** Ớt chỉ thiên, kinh giới
- **Hoa nhỏ:** Cúc vạn thọ, hoa ngũ sắc

### **Tầng giữa (ánh sáng vừa):**
- **Rau lá:** Cải ngọt, rau muống, xà lách
- **Cây dây leo:** Bầu bí nhỏ, mướp tây

### **Tầng dưới (ít ánh sáng):**
- **Cây ưa bóng:** Tía tô, rau ngót, lá lốt
- **Cây cảnh:** Trầu bà, cỏ lemon

## 💧 **HỆ THỐNG TƯỚI TIÊN TIẾN**

### **Thiết kế đặc biệt:**
- **Tưới tầng cascade:** Nước từ trên chảy xuống dưới
- **Thu nước thừa:** Máng hứng ở đáy để tái sử dụng
- **Phân phối đều:** Mỗi túi có 1 đầu nhỏ giọt

### **Timer và điều khiển:**
- **Sáng 6h:** Tưới 10 phút
- **Chiều 17h:** Tưới 5 phút
- **Cảm biến mưa:** Tự động tắt khi trời mưa

## 📊 **KẾT QUẢ SAU 2 THÁNG**

### **Năng suất thu hoạch:**
- **Rau thơm:** 200g/tuần
- **Rau lá:** 500g/tuần
- **Ớt tươi:** 100g/tuần
- **Hoa cắt:** 20 bông/tuần

### **Giá trị kinh tế:**
- **Tiết kiệm mua rau:** 300,000đ/tháng
- **Bán cho hàng xóm:** 200,000đ/tháng
- **Tổng lợi ích:** 500,000đ/tháng

### **Lợi ích khác:**
- **Tường mát hơn:** Giảm 3-5°C nhiệt độ
- **Không khí sạch:** Lọc bụi, tăng oxy
- **Thẩm mỹ:** Tường xanh mướt thay vì trống trải

## 🔧 **MẸO VẬN HÀNH**

### **Chăm sóc hàng ngày:**
- **Kiểm tra nước:** Đảm bảo hệ thống hoạt động
- **Thu hoạch:** Hái rau thường xuyên kích thích ra lá mới
- **Vệ sinh:** Loại bỏ lá vàng, cành khô

### **Bảo trì định kỳ:**
- **Thay đất:** 6 tháng/lần cho túi trồng rau lá
- **Vệ sinh ống:** 3 tháng/lần tránh tắc nghẽn
- **Sơn lại gỗ:** 1 năm/lần để bảo vệ pallet

## 🌟 **NÂNG CẤP VÀ MỞ RỘNG**

### **Phiên bản 2.0 đang thực hiện:**
- **Thêm đèn LED:** Cho góc ít ánh sáng
- **Cảm biến độ ẩm:** Tưới thông minh hơn
- **App điều khiển:** Monitor từ xa

### **Kế hoạch mở rộng:**
- **Tường thứ 2:** Bên hông nhà
- **Mái vườn:** Sử dụng mái tôn
- **Hướng dẫn:** Làm video chi tiết cho mọi người

## 💡 **KINH NGHIỆM ĐÚNG RÚT**

### **Những điều làm tốt:**
✅ **Chọn vị trí:** Hướng Đông Nam có ánh sáng cả ngày
✅ **Hệ thống tưới:** Tự động giúp tiết kiệm thời gian
✅ **Chọn cây phù hợp:** Theo từng tầng ánh sáng

### **Sai lầm cần tránh:**
❌ **Tưới quá nhiều:** Lần đầu làm rễ bị thối
❌ **Trồng cây to:** Bầu bí phát triển quá mạnh
❌ **Bỏ bê bảo trì:** Ống tưới bị tắc sau 1 tháng

## 🌍 **TÁC ĐỘNG MÔI TRƯỜNG**

### **Giảm rác thải:**
- **Tái sử dụng pallet:** Thay vì vứt đi
- **Composting:** Rác thải bếp làm phân
- **Tái chế nước:** Nước thừa tưới lại

### **Tăng sinh khối xanh:**
- **2m² tường → 50 cây:** Tăng 2500% diện tích xanh
- **Hấp thụ CO2:** Ước tính 10kg CO2/năm
- **Tạo oxy:** Đủ cho 1 người trong 2 tiếng

Ai muốn có vườn mà nhà chật thì đây là giải pháp tuyệt vời! Vừa đẹp vừa hiệu quả! 🏠🌿`,
      tags: ['vertical-garden', 'urban-farming', 'beginner-friendly', 'tiet-kiem-nuoc'],
      images: [
        'pictures/post/post-20-1-20250512T130000Z.png',
        'pictures/post/post-20-2-20250512T130000Z.png',
        'pictures/post/post-20-3-20250512T130000Z.png'
      ],
      createdAt: new Date('2025-05-12T13:00:00Z')
    }
  ];

  const createdPosts: Post[] = [];
  for (let i = 0; i < postsData.length; i++) {
    const postData = postsData[i];
    
    const post = await prisma.post.create({
      data: {
        gardenerId: postData.gardenerId,
        gardenId: postData.gardenId || null,
        plantName: postData.plantName || null,
        plantGrowStage: postData.plantGrowStage || null,
        title: postData.title,
        content: postData.content,
        createdAt: postData.createdAt || new Date(),
      }
    });

    // Thêm hình ảnh cho post
    if (postData.images) {
      for (const imageUrl of postData.images) {
        await prisma.postImage.create({
          data: {
            postId: post.id,
            url: imageUrl
          }
        });
      }
    }

    // Thêm tags cho post
    if (postData.tags) {
      for (const tagName of postData.tags) {
        const tag = createdTags.find(t => t.name === tagName);
        if (tag) {
          await prisma.postTag.create({
            data: {
              postId: post.id,
              tagId: tag.id
            }
          });
        }
      }
    }

    createdPosts.push(post);
  }

  console.log(`✅ Đã seed ${createdPosts.length} posts với hình ảnh và tags.`);

  // 3. Seed Comments - Rất nhiều comments chi tiết
  const commentsData = [
    // Comments cho post 1 (Rau muống)
    {
      postId: createdPosts[0].id,
      gardenerId: gardeners[1]?.userId || gardeners[0].userId,
      content: 'Cảm ơn anh chia sẻ chi tiết quá! Mình cũng đang thử trồng rau muống nhưng lá bị vàng, có phải do thiếu dinh dưỡng không ạ? Mình tưới đều đặn mà sao cây vẫn không xanh như của anh.',
      createdAt: new Date('2025-05-25T10:15:00Z')
    },
    {
      postId: createdPosts[0].id,
      gardenerId: gardeners[0].userId,
      content: 'Lá vàng có thể do nhiều nguyên nhân em nhé: thiếu nitrogen, úng nước, hoặc sâu bệnh. Em có thể chụp ảnh gửi anh xem được không? Anh sẽ tư vấn cụ thể hơn. Thường thì nguyên nhân chính là tưới quá nhiều nước hoặc đất không thoát nước tốt.',
      parentId: 1,
      createdAt: new Date('2025-05-25T11:30:00Z')
    },
    {
      postId: createdPosts[0].id,
      gardenerId: gardeners[2]?.userId || gardeners[0].userId,
      content: 'Mình thêm mẹo nhỏ: nên trồng rau muống trong chậu có lỗ thoát nước, và đặt đĩa hứng nước bên dưới. Cây sẽ hút nước từ dưới lên, lá không bao giờ vàng! Cách này mình học từ người Thái, họ trồng rau muống rất giỏi.',
      createdAt: new Date('2025-05-25T14:20:00Z')
    },
    {
      postId: createdPosts[0].id,
      gardenerId: gardeners[3]?.userId || gardeners[0].userId,
      content: 'Cho mình hỏi về việc bón phân NPK 16-16-8 ạ. Mình nên bón vào thời điểm nào trong ngày để cây hấp thu tốt nhất? Và có nên pha loãng không ạ?',
      createdAt: new Date('2025-05-25T16:45:00Z')
    },
    {
      postId: createdPosts[0].id,
      gardenerId: gardeners[0].userId,
      content: '@VuQuang Mình thường bón phân vào buổi chiều mát (sau 4h), pha loãng theo tỷ lệ 1g phân cho 1 lít nước. Tránh bón vào buổi trưa nắng gắt vì dễ cháy rễ. Sau khi bón nhớ tưới thêm nước sạch để phân thấm đều nhé!',
      parentId: 4,
      createdAt: new Date('2025-05-25T18:00:00Z')
    },
    {
      postId: createdPosts[0].id,
      gardenerId: gardeners[4]?.userId || gardeners[0].userId,
      content: 'Wao, 200kg rau muống từ 10m2 là con số ấn tượng quá! Có thể chia sẻ cụ thể hơn về chu kỳ trồng không ạ? Mình muốn tính toán để áp dụng cho khu vườn 5m2 của mình.',
      createdAt: new Date('2025-05-25T19:30:00Z')
    },
    {
      postId: createdPosts[0].id,
      gardenerId: gardeners[1]?.userId || gardeners[0].userId,
      content: 'Cảm ơn anh đã trả lời! Mình sẽ chụp ảnh gửi anh xem. Có lẽ do mình tưới quá nhiều thật, ngày nào cũng tưới 2 lần mà đất luôn ướt sũng.',
      parentId: 2,
      createdAt: new Date('2025-05-25T20:15:00Z')
    },

    // Comments cho post 2 (Lan ý)
    {
      postId: createdPosts[1].id,
      gardenerId: gardeners[0].userId,
      content: 'Hoa đẹp quá em! Lan ý này em mua ở đâu vậy? Mình cũng muốn trồng một chậu để trang trí ban công 😍 Nghe nói Lan ý khó trồng lắm, nhưng thấy em chăm sóc có vẻ dễ ghê.',
      createdAt: new Date('2025-05-28T16:30:00Z')
    },
    {
      postId: createdPosts[1].id,
      gardenerId: gardeners[3]?.userId || gardeners[0].userId,
      content: 'Neem oil em mua ở đâu ạ? Mình search trên Shopee, Lazada mãi không thấy shop nào bán. Có thể thay thế bằng dầu khác không?',
      createdAt: new Date('2025-05-28T18:45:00Z')
    },
    {
      postId: createdPosts[1].id,
      gardenerId: gardeners[1]?.userId || gardeners[0].userId,
      content: '@ThuyLinh Mình mua giống ở vườn ươm Đà Lạt chị ạ. Ship về HCM khoảng 3-4 ngày. Lan ý thực ra không khó như mọi người nghĩ, chỉ cần đúng cách thôi. Quan trọng là ánh sáng và tưới nước đều đặn.',
      parentId: 8,
      createdAt: new Date('2025-05-28T20:00:00Z')
    },
    {
      postId: createdPosts[1].id,
      gardenerId: gardeners[1]?.userId || gardeners[0].userId,
      content: '@DucMinh Neem oil mình mua ở shop Nông Sản Xanh trên Shopee anh ạ. Có thể thay bằng dầu đậu nành + nước xà phòng cũng hiệu quả. Tỷ lệ: 5ml dầu + 2ml nước xà phòng + 1L nước.',
      parentId: 9,
      createdAt: new Date('2025-05-28T20:15:00Z')
    },
    {
      postId: createdPosts[1].id,
      gardenerId: gardeners[4]?.userId || gardeners[0].userId,
      content: 'Mình cũng đang trồng Lan ý nhưng hoa ít và nhỏ. Có thể do mình bón phân không đúng cách. Em có thể chia sẻ cụ thể về loại phân và cách bón không?',
      createdAt: new Date('2025-05-28T21:30:00Z')
    },
    {
      postId: createdPosts[1].id,
      gardenerId: gardeners[2]?.userId || gardeners[0].userId,
      content: 'Lan ý của em màu tím đẹp quá! Mình trồng được 3 tháng mà toàn ra hoa trắng. Có phải do giống khác nhau không?',
      createdAt: new Date('2025-05-29T08:20:00Z')
    },

    // Comments cho post 3 (Cà chua cherry)
    {
      postId: createdPosts[2].id,
      gardenerId: gardeners[4]?.userId || gardeners[0].userId,
      content: 'Wow sản lượng 5kg khủng thế! Anh có bón phân gì đặc biệt không? Cà chua mình trồng quả ít lắm, chỉ được khoảng 1kg thôi 😢 Có lẽ do mình chưa tỉa chồi đúng cách.',
      createdAt: new Date('2025-05-30T10:30:00Z')
    },
    {
      postId: createdPosts[2].id,
      gardenerId: gardeners[2]?.userId || gardeners[0].userId,
      content: 'Bí quyết tỉa chồi rất quan trọng! Mình cũng trồng cherry được 2 năm rồi, confirming tất cả tips của anh đều đúng 👍 Đặc biệt là việc tỉa chồi phụ, nhiều người bỏ qua bước này.',
      createdAt: new Date('2025-05-30T12:15:00Z')
    },
    {
      postId: createdPosts[2].id,
      gardenerId: gardeners[0].userId,
      content: '@PhuongAnh Mình bón NPK 16-16-8 2 tuần/lần trong giai đoạn phát triển, NPK 15-5-20 khi ra hoa và phân hữu cơ 1 tháng/lần. Quan trọng nhất là tỉa chồi phụ để dinh dưỡng tập trung vào cành chính nhé! Mình sẽ làm video hướng dẫn tỉa chồi.',
      parentId: 14,
      createdAt: new Date('2025-05-30T13:00:00Z')
    },
    {
      postId: createdPosts[2].id,
      gardenerId: gardeners[1]?.userId || gardeners[0].userId,
      content: 'Cho mình hỏi về việc dựng giàn đỡ ạ. Mình nên dựng giàn từ lúc nào? Và loại giàn nào tốt nhất cho cà chua cherry?',
      createdAt: new Date('2025-05-30T14:45:00Z')
    },
    {
      postId: createdPosts[2].id,
      gardenerId: gardeners[3]?.userId || gardeners[0].userId,
      content: 'Giống Cherry Red F1 này mua ở đâu vậy anh? Mình tìm mãi không thấy. Và có nên ngâm hạt trước khi gieo không ạ?',
      createdAt: new Date('2025-05-30T16:20:00Z')
    },
    {
      postId: createdPosts[2].id,
      gardenerId: gardeners[0].userId,
      content: '@HaiDang Nên dựng giàn từ khi cây cao 30-40cm anh ạ. Mình dùng cọc tre 2m, buộc dây nhựa mềm. Tránh dây thép vì cắt thân cây. Giàn hình thang hoặc hình chữ A đều được.',
      parentId: 17,
      createdAt: new Date('2025-05-30T17:30:00Z')
    },
    {
      postId: createdPosts[2].id,
      gardenerId: gardeners[0].userId,
      content: '@QuocTuan Hạt giống mình mua ở công ty Rồng Vàng anh ạ. Nhớ ngâm hạt trong nước ấm 40°C trong 8-12 tiếng trước khi gieo. Tỷ lệ nảy mầm sẽ cao hơn nhiều, đồng đều hơn.',
      parentId: 18,
      createdAt: new Date('2025-05-30T17:45:00Z')
    },

    // Comments cho post 4 (Hướng dương)
    {
      postId: createdPosts[3].id,
      gardenerId: gardeners[1]?.userId || gardeners[0].userId,
      content: 'Hướng dương rất dễ trồng mà em! Chỉ cần nhiều nắng và nước. Nhớ chuyển chậu lớn sớm vì rễ phát triển rất nhanh. Mình từng để chậu nhỏ quá lâu, cây bị còi cọc.',
      createdAt: new Date('2025-05-31T08:45:00Z')
    },
    {
      postId: createdPosts[3].id,
      gardenerId: gardeners[2]?.userId || gardeners[0].userId,
      content: 'Mình trồng hướng dương năm ngoái, cây cao gần 2m luôn! Nhớ dựng cọc chống đỡ khi cây cao khoảng 50cm nhé. Không thì gió to sẽ đổ cây.',
      createdAt: new Date('2025-05-31T09:30:00Z')
    },
    {
      postId: createdPosts[3].id,
      gardenerId: gardeners[0].userId,
      content: 'Nhật ký chi tiết quá em! Mình cũng đang gieo hạt hướng dương theo cách của em. Hiện tại đang ngày thứ 4, hy vọng ngày mai sẽ thấy mầm như em.',
      createdAt: new Date('2025-05-31T10:15:00Z')
    },
    {
      postId: createdPosts[3].id,
      gardenerId: gardeners[4]?.userId || gardeners[0].userId,
      content: 'Giống Mammoth Russian này to thế! Em có định trồng để lấy hạt ăn không? Mình nghe nói hạt hướng dương tự trồng ngon hơn mua ngoài.',
      createdAt: new Date('2025-05-31T11:00:00Z')
    },
    {
      postId: createdPosts[3].id,
      gardenerId: gardeners[3]?.userId || gardeners[0].userId,
      content: '@TuanAnh Mình có ý định để 1-2 hoa chín hoàn toàn để lấy hạt anh ạ. Nghe nói hạt tự trồng không những ngon mà còn có thể gieo tiếp năm sau. Tiết kiệm hạt giống.',
      parentId: 24,
      createdAt: new Date('2025-05-31T12:30:00Z')
    },

    // Comments cho post 5 (Bạc hà trong nhà)
    {
      postId: createdPosts[4].id,
      gardenerId: gardeners[3]?.userId || gardeners[0].userId,
      content: 'Setup đẹp quá em! Em dùng đèn LED grow light loại nào vậy? Mình cũng muốn setup một góc như thế này. Có tốn điện không?',
      createdAt: new Date('2025-05-29T15:45:00Z')
    },
    {
      postId: createdPosts[4].id,
      gardenerId: gardeners[0].userId,
      content: 'Bạc hà thật sự là cây dễ trồng nhất! Mình chỉ cần giâm cành vào nước, 1 tuần là có rễ. Không cần đất cũng sống được. Đặc biệt là mùi thơm mát rất dễ chịu 😄',
      createdAt: new Date('2025-05-29T17:20:00Z')
    },
// ... tiếp tục phần comments ...

{
    postId: createdPosts[4].id,
    gardenerId: gardeners[4]?.userId || gardeners[0].userId,
    content: '@AnhThu Mình dùng đèn LED full spectrum 36W anh ạ. Chi phí điện khoảng 50k/tháng thôi, không đáng kể. Quan trọng là hiệu quả, cây xanh tốt hơn ngoài trời nhiều!',
    parentId: 26,
    createdAt: new Date('2025-05-29T18:00:00Z')
  },
  {
    postId: createdPosts[4].id,
    gardenerId: gardeners[1]?.userId || gardeners[0].userId,
    content: 'Tía tô lá to bằng bàn tay là thật không em? Mình trồng mấy tháng mà lá vẫn nhỏ xíu. Có bí quyết gì để lá to không?',
    createdAt: new Date('2025-05-29T19:15:00Z')
  },
  {
    postId: createdPosts[4].id,
    gardenerId: gardeners[2]?.userId || gardeners[0].userId,
    content: 'Ngải cứu đuổi muỗi hiệu quả thật không em? Nhà mình muỗi nhiều lắm, đang tìm cách đuổi tự nhiên.',
    createdAt: new Date('2025-05-29T20:30:00Z')
  },
  {
    postId: createdPosts[4].id,
    gardenerId: gardeners[4]?.userId || gardeners[0].userId,
    content: '@HongNhung Bí quyết là ánh sáng đủ và bón phân đạm chị ạ. Mình bón NPK 20-10-10 2 tuần/lần, tía tô sẽ ra lá to và xanh đậm.',
    parentId: 29,
    createdAt: new Date('2025-05-29T21:00:00Z')
  },
  {
    postId: createdPosts[4].id,
    gardenerId: gardeners[4]?.userId || gardeners[0].userId,
    content: '@ThanhTam Ngải cứu hiệu quả lắm chị ạ! Nhà mình giảm muỗi 80% kể từ khi trồng. Có thể hun khói lá khô hoặc để cây tươi ở góc phòng.',
    parentId: 30,
    createdAt: new Date('2025-05-29T21:15:00Z')
  },

  // Comments cho post 6 (Compost)
  {
    postId: createdPosts[5].id,
    gardenerId: gardeners[1]?.userId || gardeners[0].userId,
    content: 'Hướng dẫn chi tiết quá anh! Mình đã thử làm compost nhiều lần nhưng toàn bị hôi. Có lẽ do không đúng tỷ lệ nâu-xanh như anh nói.',
    createdAt: new Date('2025-05-26T17:30:00Z')
  },
  {
    postId: createdPosts[5].id,
    gardenerId: gardeners[4]?.userId || gardeners[0].userId,
    content: 'Men vi sinh EM anh mua ở đâu ạ? Giá bao nhiêu vậy? Mình tìm trên mạng có nhiều loại quá, không biết chọn loại nào.',
    createdAt: new Date('2025-05-26T19:15:00Z')
  },
  {
    postId: createdPosts[5].id,
    gardenerId: gardeners[0].userId,
    content: '@MinhChau Tỷ lệ 60% xanh - 40% nâu là quan trọng nhất em ạ. Nếu hôi có thể do quá nhiều rác xanh hoặc quá ướt. Thêm lá khô, giấy báo cũ vào và đảo trộn thường xuyên.',
    parentId: 33,
    createdAt: new Date('2025-05-26T20:00:00Z')
  },
  {
    postId: createdPosts[5].id,
    gardenerId: gardeners[0].userId,
    content: '@LanAnh Mình mua ở shop Sinh Học Xanh, khoảng 150k/chai 1L. Dùng được 6 tháng. Có thể thay bằng nước vo gạo ủ chua cũng hiệu quả.',
    parentId: 34,
    createdAt: new Date('2025-05-26T20:15:00Z')
  },
  {
    postId: createdPosts[5].id,
    gardenerId: gardeners[2]?.userId || gardeners[0].userId,
    content: 'Vỏ trứng nghiền có tác dụng gì trong compost ạ? Mình thường vứt vỏ trứng, giờ biết tận dụng được rồi!',
    createdAt: new Date('2025-05-26T21:30:00Z')
  },
  {
    postId: createdPosts[5].id,
    gardenerId: gardeners[3]?.userId || gardeners[0].userId,
    content: 'Timeline 8 tuần hoàn thành là chuẩn không anh? Mình làm được 6 tuần rồi mà vẫn chưa thành đất.',
    createdAt: new Date('2025-05-27T08:45:00Z')
  },

  // Comments cho post 7 (Tưới tự động)
  {
    postId: createdPosts[6].id,
    gardenerId: gardeners[3]?.userId || gardeners[0].userId,
    content: 'Quá hay anh! Mình cũng đang muốn làm hệ thống tương tự. Anh có thể share link mua thiết bị được không? Đặc biệt là timer điện tử.',
    createdAt: new Date('2025-05-27T12:30:00Z')
  },
  {
    postId: createdPosts[6].id,
    gardenerId: gardeners[2]?.userId || gardeners[0].userId,
    content: 'Timer này có chống nước không anh? Mình đặt ngoài trời nên lo bị ướt. Và có thể lập trình nhiều thời điểm khác nhau không?',
    createdAt: new Date('2025-05-27T14:45:00Z')
  },
  {
    postId: createdPosts[6].id,
    gardenerId: gardeners[1]?.userId || gardeners[0].userId,
    content: 'Bơm nước mini 12V này có ồn không anh? Nhà mình ở chung cư, sợ làm ồn ảnh hưởng hàng xóm.',
    createdAt: new Date('2025-05-27T16:20:00Z')
  },
  {
    postId: createdPosts[6].id,
    gardenerId: gardeners[0].userId,
    content: '@DucThang Timer có rating IP65, chống nước tốt anh ạ. Có thể lập trình 8 thời điểm khác nhau trong ngày. Link mình gửi inbox nhé!',
    parentId: 40,
    createdAt: new Date('2025-05-27T17:00:00Z')
  },
  {
    postId: createdPosts[6].id,
    gardenerId: gardeners[0].userId,
    content: '@ThuyVy Bơm rất êm em ạ, tiếng ồn chỉ bằng quạt máy tính. Mình đặt trong thùng xốp còn êm hơn nữa.',
    parentId: 41,
    createdAt: new Date('2025-05-27T17:15:00Z')
  },
  {
    postId: createdPosts[6].id,
    gardenerId: gardeners[4]?.userId || gardeners[0].userId,
    content: 'Cảm biến độ ẩm đất có cần thiết không anh? Hay chỉ cần timer là đủ?',
    createdAt: new Date('2025-05-27T18:30:00Z')
  },

  // Comments cho post 8 (Giâm hoa hồng)
  {
    postId: createdPosts[7].id,
    gardenerId: gardeners[4]?.userId || gardeners[0].userId,
    content: 'Tỷ lệ thành công 95% cao quá anh! Mình thử giâm mấy lần toàn thất bại. Có thể do thời điểm không đúng hoặc cách chăm sóc.',
    createdAt: new Date('2025-05-24T15:00:00Z')
  },
  {
    postId: createdPosts[7].id,
    gardenerId: gardeners[1]?.userId || gardeners[0].userId,
    content: 'IBA mua ở đâu ạ anh? Mình chỉ biết dùng mật ong thôi. IBA có hiệu quả hơn mật ong nhiều không?',
    createdAt: new Date('2025-05-24T16:30:00Z')
  },
  {
    postId: createdPosts[7].id,
    gardenerId: gardeners[2]?.userId || gardeners[0].userId,
    content: 'Hồng cổ Hà Nội 98% thành công là ấn tượng! Mình cũng thích giống này, hoa thơm và đẹp. Anh có bán cành giống không ạ?',
    createdAt: new Date('2025-05-24T17:45:00Z')
  },
  {
    postId: createdPosts[7].id,
    gardenerId: gardeners[0].userId,
    content: '@LinhNguyen Bí quyết là thời điểm anh ạ. Tháng 10-12 là lý tưởng nhất, thời tiết mát độ ẩm cao. Và phải kiên nhẫn, đừng động đến cành trong 1 tháng đầu.',
    parentId: 45,
    createdAt: new Date('2025-05-24T18:20:00Z')
  },
  {
    postId: createdPosts[7].id,
    gardenerId: gardeners[0].userId,
    content: '@MaiLe IBA mình mua ở shop hoá chất nông nghiệp anh ạ. Hiệu quả hơn mật ong nhưng mật ong cũng tốt và an toàn hơn. Tỷ lệ mật ong 1:10 với nước.',
    parentId: 46,
    createdAt: new Date('2025-05-24T18:35:00Z')
  },
  {
    postId: createdPosts[7].id,
    gardenerId: gardeners[3]?.userId || gardeners[0].userId,
    content: 'Túi ni lông tạo ẩm có cần thiết không anh? Mình lo che kín thế dễ nấm mốc.',
    createdAt: new Date('2025-05-24T19:50:00Z')
  },

  // Comments cho post 9 (Dâu tây trong thùng xốp)
  {
    postId: createdPosts[8].id,
    gardenerId: gardeners[0].userId,
    content: 'Dâu tây trong thùng xốp mà ra quả được là giỏi thật! Mình tưởng dâu tây phải trồng đất mới được. Thùng xốp có ảnh hưởng gì không em?',
    createdAt: new Date('2025-05-23T11:30:00Z')
  },
  {
    postId: createdPosts[8].id,
    gardenerId: gardeners[1]?.userId || gardeners[0].userId,
    content: 'Giống Camarosa này mua ở đâu vậy em? Mình tìm mãi không thấy. Có ship toàn quốc không?',
    createdAt: new Date('2025-05-23T13:15:00Z')
  },
  {
    postId: createdPosts[8].id,
    gardenerId: gardeners[4]?.userId || gardeners[0].userId,
    content: 'Che lưới chống chim là ý tưởng hay! Mình bị chim ăn mất mấy quả dâu tây đầu tiên. Loại lưới nào tốt nhất em?',
    createdAt: new Date('2025-05-23T14:45:00Z')
  },
  {
    postId: createdPosts[8].id,
    gardenerId: gardeners[2]?.userId || gardeners[0].userId,
    content: 'Thụ phấn bằng bông là sao em? Có cần làm hàng ngày không? Mình chưa biết kỹ thuật này.',
    createdAt: new Date('2025-05-23T16:20:00Z')
  },
  {
    postId: createdPosts[8].id,
    gardenerId: gardeners[3]?.userId || gardeners[0].userId,
    content: '@NgocAnh Thùng xốp không ảnh hưởng gì anh ạ, miễn là thoát nước tốt. Còn bền hơn chậu nhựa nữa!',
    parentId: 51,
    createdAt: new Date('2025-05-23T17:00:00Z')
  },
  {
    postId: createdPosts[8].id,
    gardenerId: gardeners[3]?.userId || gardeners[0].userId,
    content: '@HuongGiang Mình mua ở vườn ươm Đà Lạt chị ạ. Shop Dâu Tây Đà Lạt trên Shopee có ship toàn quốc.',
    parentId: 52,
    createdAt: new Date('2025-05-23T17:15:00Z')
  },

  // Comments cho post 10 (Ớt chuông 7 màu)
  {
    postId: createdPosts[9].id,
    gardenerId: gardeners[0].userId,
    content: 'Vườn cầu vồng đẹp quá em! 7 màu ớt chuông là ấn tượng thật. Em có bán hạt giống không? Mình cũng muốn tạo vườn như thế này.',
    createdAt: new Date('2025-05-22T15:30:00Z')
  },
  {
    postId: createdPosts[9].id,
    gardenerId: gardeners[1]?.userId || gardeners[0].userId,
    content: 'Ớt tím và đen hiếm thấy quá! Mua ở đâu vậy em? Có khó trồng hơn các màu khác không?',
    createdAt: new Date('2025-05-22T16:45:00Z')
  },
  {
    postId: createdPosts[9].id,
    gardenerId: gardeners[2]?.userId || gardeners[0].userId,
    content: 'Lưới che 70% có ảnh hưởng đến màu sắc ớt không em? Mình lo che quá kỹ làm ớt nhạt màu.',
    createdAt: new Date('2025-05-22T18:20:00Z')
  },
  {
    postId: createdPosts[9].id,
    gardenerId: gardeners[3]?.userId || gardeners[0].userId,
    content: 'Hệ thống nhỏ giọt cho 7 chậu như thế nào em? Có dùng timer không?',
    createdAt: new Date('2025-05-22T19:15:00Z')
  },
  {
    postId: createdPosts[9].id,
    gardenerId: gardeners[4]?.userId || gardeners[0].userId,
    content: '@TuanVu Mình có hạt giống anh ạ, nhưng chỉ đủ cho mình gieo tiếp. Có thể mua ở shop Hạt Giống Quốc Tế.',
    parentId: 57,
    createdAt: new Date('2025-05-22T20:00:00Z')
  },

  // Comments cho post 11 (Thủy canh DIY)
  {
    postId: createdPosts[10].id,
    gardenerId: gardeners[1]?.userId || gardeners[0].userId,
    content: 'Thủy canh từ hộp nhựa sáng tạo quá anh! Chi phí 100k là quá rẻ. Anh có hướng dẫn video không ạ?',
    createdAt: new Date('2025-05-21T10:30:00Z')
  },
  {
    postId: createdPosts[10].id,
    gardenerId: gardeners[2]?.userId || gardeners[0].userId,
    content: 'pH pen và EC meter đắt không anh? Có thể thay thế bằng gì khác không?',
    createdAt: new Date('2025-05-21T12:15:00Z')
  },
  {
    postId: createdPosts[10].id,
    gardenerId: gardeners[3]?.userId || gardeners[0].userId,
    content: 'Dung dịch AB hydro pha như thế nào anh? Có công thức cụ thể không?',
    createdAt: new Date('2025-05-21T14:45:00Z')
  },
  {
    postId: createdPosts[10].id,
    gardenerId: gardeners[4]?.userId || gardeners[0].userId,
    content: 'Rau thủy canh có ngon hơn rau đất không anh? Về mặt dinh dưỡng thì sao?',
    createdAt: new Date('2025-05-21T16:20:00Z')
  },
  {
    postId: createdPosts[10].id,
    gardenerId: gardeners[0].userId,
    content: '@HongSon Video hướng dẫn mình sẽ làm tuần sau anh ạ. Sẽ quay từng bước một cách chi tiết nhất.',
    parentId: 62,
    createdAt: new Date('2025-05-21T17:00:00Z')
  },

  // Comments cho post 12 (Hoa súng mini)
  {
    postId: createdPosts[11].id,
    gardenerId: gardeners[0].userId,
    content: 'Hoa súng đẹp như tranh thật em! Chậu 60cm có nặng không? Đặt trong nhà được không?',
    createdAt: new Date('2025-05-20T17:30:00Z')
  },
  {
    postId: createdPosts[11].id,
    gardenerId: gardeners[2]?.userId || gardeners[0].userId,
    content: 'Cá bảy màu trong chậu súng có ảnh hưởng gì không em? Mình lo cá làm nước đục.',
    createdAt: new Date('2025-05-20T18:45:00Z')
  },
  {
    postId: createdPosts[11].id,
    gardenerId: gardeners[3]?.userId || gardeners[0].userId,
    content: 'Giống Nymphaea Aurora mua ở đâu em? Có các màu khác không?',
    createdAt: new Date('2025-05-20T19:30:00Z')
  },
  {
    postId: createdPosts[11].id,
    gardenerId: gardeners[1]?.userId || gardeners[0].userId,
    content: '@ThanhLong Chậu khá nặng anh ạ, khoảng 50kg khi đầy nước. Đặt trong nhà được nhưng cần đế chắc chắn.',
    parentId: 67,
    createdAt: new Date('2025-05-20T20:15:00Z')
  },

  // Comments cho post 13 (Phân bón từ vỏ trái cây)
  {
    postId: createdPosts[12].id,
    gardenerId: gardeners[1]?.userId || gardeners[0].userId,
    content: 'Công thức phân bón từ vỏ trái cây hay quá anh! Có mùi hôi không? Ủ trong nhà được không?',
    createdAt: new Date('2025-05-19T12:30:00Z')
  },
  {
    postId: createdPosts[12].id,
    gardenerId: gardeners[3]?.userId || gardeners[0].userId,
    content: 'Men nở dùng loại nào anh? Men làm bánh có được không?',
    createdAt: new Date('2025-05-19T14:15:00Z')
  },
  {
    postId: createdPosts[12].id,
    gardenerId: gardeners[4]?.userId || gardeners[0].userId,
    content: 'Pha 1:20 là nồng độ cao quá không anh? Có làm cháy rễ không?',
    createdAt: new Date('2025-05-19T16:45:00Z')
  },
  {
    postId: createdPosts[12].id,
    gardenerId: gardeners[0].userId,
    content: '@VanTung Mùi thơm nhẹ như rượu vang anh ạ. Ủ ngoài trời tốt hơn, trong nhà cũng được nếu thông thoáng.',
    parentId: 70,
    createdAt: new Date('2025-05-19T17:30:00Z')
  },

  // Comments cho post 14 (Nông nghiệp Nhật Bản)
  {
    postId: createdPosts[13].id,
    gardenerId: gardeners[0].userId,
    content: 'Mô hình Nhật Bản chuyên nghiệp quá em! EM Bokashi mua ở đâu vậy? Đắt không?',
    createdAt: new Date('2025-05-18T14:30:00Z')
  },
  {
    postId: createdPosts[13].id,
    gardenerId: gardeners[1]?.userId || gardeners[0].userId,
    content: 'Mizuna và Komatsuna là rau gì vậy em? Có ngon không? Mua hạt giống ở đâu?',
    createdAt: new Date('2025-05-18T16:20:00Z')
  },
  {
    postId: createdPosts[13].id,
    gardenerId: gardeners[2]?.userId || gardeners[0].userId,
    content: 'Companion planting hay quá! Em có thể chia sẻ thêm về các cặp cây trồng xen tốt không?',
    createdAt: new Date('2025-05-18T17:45:00Z')
  },
  {
    postId: createdPosts[13].id,
    gardenerId: gardeners[4]?.userId || gardeners[0].userId,
    content: 'Thiết kế luống 1.2m x 20cm chuẩn Nhật thật! Mình sẽ áp dụng ngay.',
    createdAt: new Date('2025-05-18T19:10:00Z')
  },

  // Comments cho post 15 (Hoa đồng tiền)
  {
    postId: createdPosts[14].id,
    gardenerId: gardeners[1]?.userId || gardeners[0].userId,
    content: 'Hoa đồng tiền đẹp và có ích quá em! Làm trà hoa có vị như thế nào?',
    createdAt: new Date('2025-05-17T16:30:00Z')
  },
  {
    postId: createdPosts[14].id,
    gardenerId: gardeners[2]?.userId || gardeners[0].userId,
    content: 'Tỉa ngọn sớm để ra nhiều nhánh là mẹo hay! Mình sẽ thử.',
    createdAt: new Date('2025-05-17T17:45:00Z')
  },
  {
    postId: createdPosts[14].id,
    gardenerId: gardeners[3]?.userId || gardeners[0].userId,
    content: 'Cánh hoa ăn được thật à em? Có độc không? Vị như thế nào?',
    createdAt: new Date('2025-05-17T18:20:00Z')
  },
  {
    postId: createdPosts[14].id,
    gardenerId: gardeners[4]?.userId || gardeners[0].userId,
    content: '@BichDao Trà hoa có vị nhẹ nhàng, hơi đắng chị ạ. Rất tốt cho da và tiêu hóa.',
    parentId: 78,
    createdAt: new Date('2025-05-17T19:00:00Z')
  },

  // Comments cho post 16 (Aquaponics)
  {
    postId: createdPosts[15].id,
    gardenerId: gardeners[1]?.userId || gardeners[0].userId,
    content: 'Aquaponics phức tạp quá anh! Có cần kiến thức chuyên môn không? Người mới bắt đầu có làm được không?',
    createdAt: new Date('2025-05-16T11:30:00Z')
  },
  {
    postId: createdPosts[15].id,
    gardenerId: gardeners[2]?.userId || gardeners[0].userId,
    content: 'Cá rô phi có ăn được không anh? Thịt có ngon không?',
    createdAt: new Date('2025-05-16T13:15:00Z')
  },
  {
    postId: createdPosts[15].id,
    gardenerId: gardeners[3]?.userId || gardeners[0].userId,
    content: 'Test kit pH, TDS đắt không anh? Có thể tự làm không?',
    createdAt: new Date('2025-05-16T14:45:00Z')
  },
  {
    postId: createdPosts[15].id,
    gardenerId: gardeners[0].userId,
    content: '@MinhTam Người mới bắt đầu hoàn toàn làm được anh ạ. Mình sẽ làm video hướng dẫn chi tiết.',
    parentId: 82,
    createdAt: new Date('2025-05-16T15:30:00Z')
  },

  // Comments cho post 17 (Cây ổi lùn)
  {
    postId: createdPosts[16].id,
    gardenerId: gardeners[0].userId,
    content: '8 tháng đã có quả là nhanh thật em! Cây giống 2 năm tuổi mua giá bao nhiêu?',
    createdAt: new Date('2025-05-15T15:30:00Z')
  },
  {
    postId: createdPosts[16].id,
    gardenerId: gardeners[1]?.userId || gardeners[0].userId,
    content: 'Ổi lùn Thái Lan ngọt thật không em? So với ổi ta thì sao?',
    createdAt: new Date('2025-05-15T16:45:00Z')
  },
  {
    postId: createdPosts[16].id,
    gardenerId: gardeners[3]?.userId || gardeners[0].userId,
    content: 'Chậu 80cm có quá lớn không em? Để trong nhà được không?',
    createdAt: new Date('2025-05-15T17:20:00Z')
  },
  {
    postId: createdPosts[16].id,
    gardenerId: gardeners[2]?.userId || gardeners[0].userId,
    content: 'Bọc túi ni lông chống sâu đục quả hiệu quả thật không em?',
    createdAt: new Date('2025-05-15T18:30:00Z')
  },

  // Comments cho post 18 (Trồng nấm)
  {
    postId: createdPosts[17].id,
    gardenerId: gardeners[0].userId,
    content: 'Trồng nấm tại nhà hay quá em! Có an toàn không? Mình lo về vệ sinh.',
    createdAt: new Date('2025-05-14T12:30:00Z')
  },
  {
    postId: createdPosts[17].id,
    gardenerId: gardeners[1]?.userId || gardeners[0].userId,
    content: 'Bịch giống nấm mua ở đâu em? Có bảo hành không?',
    createdAt: new Date('2025-05-14T14:15:00Z')
  },
  {
    postId: createdPosts[17].id,
    gardenerId: gardeners[3]?.userId || gardeners[0].userId,
    content: 'Máy phun sương có ồn không em? Phòng ngủ có trồng được không?',
    createdAt: new Date('2025-05-14T16:45:00Z')
  },
  {
    postId: createdPosts[17].id,
    gardenerId: gardeners[4]?.userId || gardeners[0].userId,
    content: 'Nấm tự trồng ngon hơn nấm mua ngoài nhiều không em?',
    createdAt: new Date('2025-05-14T18:20:00Z')
  },

  // Comments cho post 19 (Cây bơ từ hạt)
  {
    postId: createdPosts[18].id,
    gardenerId: gardeners[0].userId,
    content: 'Trồng bơ từ hạt kiên trì quá em! 6 tháng mới thấy thành quả.',
    createdAt: new Date('2025-05-13T17:30:00Z')
  },
  {
    postId: createdPosts[18].id,
    gardenerId: gardeners[1]?.userId || gardeners[0].userId,
    content: 'Cây bơ có thể làm bonsai được không em? Mình thích cây nhỏ gọn.',
    createdAt: new Date('2025-05-13T18:45:00Z')
  },
  {
    postId: createdPosts[18].id,
    gardenerId: gardeners[2]?.userId || gardeners[0].userId,
    content: 'Hạt bơ phải để lộ đỉnh khi trồng đất à em? Mình cứ chôn ngập luôn.',
    createdAt: new Date('2025-05-13T19:20:00Z')
  },
  {
    postId: createdPosts[18].id,
    gardenerId: gardeners[4]?.userId || gardeners[0].userId,
    content: 'Cây bơ trong chậu có ra quả được không em?',
    createdAt: new Date('2025-05-13T20:15:00Z')
  },

  // Comments cho post 20 (Vườn dọc)
  {
    postId: createdPosts[19].id,
    gardenerId: gardeners[0].userId,
    content: 'Vườn dọc từ pallet sáng tạo quá em! 50 cây trong 2m2 là ấn tượng.',
    createdAt: new Date('2025-05-12T14:30:00Z')
  },
  {
    postId: createdPosts[19].id,
    gardenerId: gardeners[1]?.userId || gardeners[0].userId,
    content: 'Pallet gỗ cũ có an toàn không em? Mình lo hóa chất.',
    createdAt: new Date('2025-05-12T15:45:00Z')
  },
  {
    postId: createdPosts[19].id,
    gardenerId: gardeners[2]?.userId || gardeners[0].userId,
    content: 'Vải địa kỹ thuật bền không em? Dùng được bao lâu?',
    createdAt: new Date('2025-05-12T16:20:00Z')
  },
  {
    postId: createdPosts[19].id,
    gardenerId: gardeners[3]?.userId || gardeners[0].userId,
    content: 'Hệ thống tưới cascade hay quá! Tiết kiệm nước thật không em?',
    createdAt: new Date('2025-05-12T17:30:00Z')
  },
  {
    postId: createdPosts[19].id,
    gardenerId: gardeners[4]?.userId || gardeners[0].userId,
    content: '@AnhTu Pallet mình đã xử lý sạch sẽ và sơn dầu tự nhiên anh ạ. An toàn hoàn toàn.',
    parentId: 99,
    createdAt: new Date('2025-05-12T18:00:00Z')
  }
];

const createdComments: Comment[] = [];
for (let i = 0; i < commentsData.length; i++) {
  const commentData = commentsData[i];
  
  const comment = await prisma.comment.create({
    data: {
      postId: commentData.postId,
      gardenerId: commentData.gardenerId,
      content: commentData.content,
      parentId: commentData.parentId || null,
      createdAt: commentData.createdAt || new Date(),
    }
  });
  createdComments.push(comment);
}

console.log(`✅ Đã seed ${createdComments.length} comments (bao gồm replies).`);

// 4. Seed Votes cho Posts và Comments
const votes: Vote[] = [];

// Vote cho posts - tạo vote ngẫu nhiên cho mỗi post
for (const post of createdPosts) {
  // Mỗi post sẽ có 3-5 gardener vote
  const numVoters = Math.floor(Math.random() * 3) + 3; // 3-5 voters
  const voters = gardeners.slice(0, Math.min(numVoters, gardeners.length));
  
  for (const voter of voters) {
    if (voter.userId !== post.gardenerId) { // Không vote cho post của chính mình
      const voteValue = Math.random() > 0.15 ? 1 : -1; // 85% upvote, 15% downvote
      
      const vote = await prisma.vote.create({
        data: {
          gardenerId: voter.userId,
          targetType: VoteTargetType.POST,
          postId: post.id,
          commentId: null,
          voteValue: voteValue,
          createdAt: new Date(post.createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000)
        }
      });
      votes.push(vote);
    }
  }
}

// Vote cho comments - tạo vote cho nhiều comment
for (let i = 0; i < createdComments.length; i++) {
  const comment = createdComments[i];
  const shouldVote = Math.random() > 0.3; // 70% comments có vote
  
  if (shouldVote) {
    const numVoters = Math.floor(Math.random() * 3) + 1; // 1-3 voters cho mỗi comment
    const voters = gardeners.slice(0, Math.min(numVoters, gardeners.length));
    
    for (const voter of voters) {
      if (voter.userId !== comment.gardenerId) {
        const voteValue = Math.random() > 0.25 ? 1 : -1; // 75% upvote, 25% downvote
        
        const vote = await prisma.vote.create({
          data: {
            gardenerId: voter.userId,
            targetType: VoteTargetType.COMMENT,
            postId: null,
            commentId: comment.id,
            voteValue: voteValue,
            createdAt: new Date(comment.createdAt.getTime() + Math.random() * 12 * 60 * 60 * 1000)
          }
        });
        votes.push(vote);
      }
    }
  }
}

console.log(`✅ Đã seed ${votes.length} votes cho posts và comments.`);

// 5. Cập nhật total_vote cho posts
for (const post of createdPosts) {
  const postVotes = await prisma.vote.findMany({
    where: {
      targetType: VoteTargetType.POST,
      postId: post.id
    }
  });
  
  const totalVote = postVotes.reduce((sum, vote) => sum + vote.voteValue, 0);
  
  await prisma.post.update({
    where: { id: post.id },
    data: { total_vote: totalVote }
  });
}

// 6. Cập nhật score cho comments
for (const comment of createdComments) {
  const commentVotes = await prisma.vote.findMany({
    where: {
      targetType: VoteTargetType.COMMENT,
      commentId: comment.id
    }
  });
  
  const score = commentVotes.reduce((sum, vote) => sum + vote.voteValue, 0);
  
  await prisma.comment.update({
    where: { id: comment.id },
    data: { score: score }
  });
}

console.log('✅ Đã cập nhật total_vote cho posts và score cho comments.');

// 7. Seed Follow relationships
const follows = [
  // VietTranDai (supergardener) được follow bởi tất cả user khác
  { followerId: gardeners[1]?.userId || gardeners[0].userId, followedId: gardeners[0].userId },
  { followerId: gardeners[2]?.userId || gardeners[0].userId, followedId: gardeners[0].userId },
  { followerId: gardeners[3]?.userId || gardeners[0].userId, followedId: gardeners[0].userId },
  { followerId: gardeners[4]?.userId || gardeners[0].userId, followedId: gardeners[0].userId },
  
  // Một số mối quan hệ follow lẫn nhau
  { followerId: gardeners[0].userId, followedId: gardeners[1]?.userId || gardeners[0].userId },
  { followerId: gardeners[0].userId, followedId: gardeners[2]?.userId || gardeners[0].userId },
  { followerId: gardeners[1]?.userId || gardeners[0].userId, followedId: gardeners[2]?.userId || gardeners[0].userId },
  { followerId: gardeners[2]?.userId || gardeners[0].userId, followedId: gardeners[3]?.userId || gardeners[0].userId },
  { followerId: gardeners[3]?.userId || gardeners[0].userId, followedId: gardeners[4]?.userId || gardeners[0].userId },
  { followerId: gardeners[4]?.userId || gardeners[0].userId, followedId: gardeners[1]?.userId || gardeners[0].userId },
  { followerId: gardeners[2]?.userId || gardeners[0].userId, followedId: gardeners[4]?.userId || gardeners[0].userId },
  { followerId: gardeners[1]?.userId || gardeners[0].userId, followedId: gardeners[3]?.userId || gardeners[0].userId },
];

const validFollows = follows.filter(f => f.followerId !== f.followedId); // Loại bỏ self-follow

for (const followData of validFollows) {
  try {
    await prisma.follow.upsert({
      where: {
        followerId_followedId: {
          followerId: followData.followerId,
          followedId: followData.followedId
        }
      },
      update: {},
      create: {
        followerId: followData.followerId,
        followedId: followData.followedId,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random time trong 30 ngày qua
      }
    });
  } catch (error) {
    console.log(`Bỏ qua follow relationship đã tồn tại: ${followData.followerId} -> ${followData.followedId}`);
  }
}

console.log(`✅ Đã seed ${validFollows.length} follow relationships.`);
  })

  console.log(`
    🎉 Seed Social Network hoàn thành!
    📊 Tổng kết:
       - Tags, Posts, Comments, Votes và Follow relationships
       - Dữ liệu đồng bộ và nhất quán
       - Sẵn sàng cho testing và development
       
    ✨ Hệ thống mạng xã hội vườn trồng đã hoạt động!
  `);
}