import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { UserController } from './user/user.controller';
import { UserModule } from './user/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CompanyController } from './company/company.controller';
import { CompanyModule } from './company/company.module';
import { MulterModule } from '@nestjs/platform-express';
import { DepartmentController } from './department/department.controller';
import { DepartmentModule } from './department/department.module';

@Module({
  imports: [
    MulterModule.register({
      limits: { fileSize: 5 * 1024 * 1024 }, // Limit to 5MB
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UserModule,
    CompanyModule,
    DepartmentModule,
  ],
  controllers: [
    AppController,
    AuthController,
    UserController,
    CompanyController,
    DepartmentController,
  ],
  providers: [AppService],
})
export class AppModule {}
