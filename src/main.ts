import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { ValidationPipe } from '@nestjs/common';
import { PermissionsGuard } from './guards/permissions.guard';
import { PrismaService } from './prisma/prisma.service';
import { loggerMiddleware } from './utils/logger.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });
  app.use(bodyParser.json({ limit: '50mb' })); // Adjust limits as needed
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  app.use(loggerMiddleware);
  const prisma = app.get(PrismaService);
  app.useGlobalGuards(new PermissionsGuard(new Reflector(), prisma));
  await app.listen(3333);
}
bootstrap();
