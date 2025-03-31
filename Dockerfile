# Sử dụng image Node.js phiên bản 16-alpine cho kích thước nhỏ và hiệu năng cao
FROM node:20-alpine

# Đặt label cho container (tùy chọn, giúp quản lý metadata)
LABEL maintainer="trandaiviet78@gmail.com"
LABEL app="smart-farm-server"

# Thiết lập thư mục làm việc trong container
WORKDIR /usr/src/app

# Copy các file package để cài đặt dependencies trước khi copy toàn bộ source (tận dụng caching)
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ mã nguồn của dự án vào container
COPY . .

# Build ứng dụng (nếu dùng TypeScript)
RUN npm run build

# Expose port mà ứng dụng NestJS lắng nghe (mặc định 3000)
EXPOSE 3000

# Command chạy ứng dụng sau khi build
CMD ["node", "dist/main.js"]
