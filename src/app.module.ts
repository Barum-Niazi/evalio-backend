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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UserModule,
    CompanyModule,
  ],
  controllers: [
    AppController,
    AuthController,
    UserController,
    CompanyController,
  ],
  providers: [AppService],
})
export class AppModule {}
