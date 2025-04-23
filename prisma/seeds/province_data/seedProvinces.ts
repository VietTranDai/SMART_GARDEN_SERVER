// prisma/seeds/province_data/seedProvinces.ts
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

export async function seedProvinces(prisma: PrismaClient): Promise<void> {
  // Điều chỉnh đường dẫn tới file SQL (giả sử file ImportData_vn_units.sql nằm ở cùng thư mục với file seed này)
  const sqlFilePath = path.join(__dirname, 'ImportData_vn_units.sql');
  try {
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

    // Loại bỏ comment (các dòng bắt đầu bằng '--') nếu cần
    const filteredSql = sqlContent
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n');

    // Tách từng câu lệnh SQL theo dấu chấm phẩy (;)
    const statements = filteredSql
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const stmt of statements) {
      try {
        await prisma.$executeRawUnsafe(stmt);
        // console.log('Đã thực thi câu lệnh: ', stmt.substring(0, 50), '...');
      } catch (err) {
        // console.error(
        //   'Lỗi khi thực thi câu lệnh: ',
        //   stmt.substring(0, 50),
        //   '...',
        // );
        // console.error(err);
      }
    }
    console.log('Đã seed Provinces từ file SQL.');
  } catch (err) {
    console.error('Lỗi khi đọc hoặc thực thi file SQL: ', err);
    throw err;
  }
}
