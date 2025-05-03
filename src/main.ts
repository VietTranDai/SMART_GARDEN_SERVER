import {NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { useContainer } from 'class-validator';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { ResponseInterceptor } from './common/pipes/response.interceptor';
import { AllExceptionsFilter } from './common/pipes/http-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.useStaticAssets(join(process.cwd(), 'pictures'), {
    prefix: '/pictures/',
  });

  app.setGlobalPrefix('v1');
  app.use(cookieParser());

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  const configService = app.get(ConfigService);
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

  app.enableCors({ origin: true, credentials: true });

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap().catch(err => {
  console.error('Error during app bootstrap', err);
  process.exit(1);
});
