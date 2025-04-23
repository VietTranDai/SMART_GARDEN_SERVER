import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { useContainer } from 'class-validator';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  // Tạo ứng dụng NestJS
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('v1');
  app.use(cookieParser());

  // Sử dụng container của NestJS cho class-validator để tự động resolve các dependency
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // // Đăng ký global validation pipe
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,
  //     transform: true,
  //     forbidNonWhitelisted: false,
  //   }),
  // );

  // Lấy ConfigService để truy xuất biến môi trường
  const configService = app.get(ConfigService);

  // Cấu hình Swagger cho API
  const swaggerConfig = new DocumentBuilder()
    .setTitle(configService.get<string>('SWAGGER_TITLE') || 'Smart Garden API')
    .setDescription(
      configService.get<string>('SWAGGER_DESCRIPTION') ||
        'API documentation for Smart Garden Server',
    )
    .setVersion(configService.get<string>('SWAGGER_VERSION') || '1.0')
    .addTag(configService.get<string>('SWAGGER_TAG') || 'smart-garden')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  // Cấu hình CORS, bạn có thể tuỳ chỉnh allowed origins nếu cần
  const allowedOrigins = configService
    .get<string>('ALLOWED_ORIGINS')
    ?.split(',') || ['http://localhost:3000'];
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Lấy port từ biến môi trường, mặc định 8080
  const port = configService.get<number>('PORT') || 8080;

  // (Tùy chọn) Lấy HttpAdapterHost để đăng ký các filter global nếu cần
  const httpAdapterHost = app.get(HttpAdapterHost);
  // app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));

  // Khởi chạy ứng dụng
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
