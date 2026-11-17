
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { setupSwagger } from './swagger/swagger.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS
  app.enableCors();

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception handling
  app.useGlobalFilters(new AllExceptionsFilter());

  // Standard success response
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Swagger documentation
  setupSwagger(app);

  // Server port
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;

  await app.listen(port);

  console.log(`API: http://localhost:${port}`);
  console.log(`Docs: http://localhost:${port}/docs`);
}

void bootstrap();
