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
import { EmployeeController } from './employee/employee.controller';
import { EmployeeService } from './employee/employee.service';
import { EmployeeModule } from './employee/employee.module';
import { FeedbackController } from './feedback/feedback.controller';
import { FeedbackModule } from './feedback/feedback.module';
import { TagModule } from './tags/tag.module';
import { NotificationController } from './notification/notification.controller';
import { NotificationModule } from './notification/notification.module';
import { NotificationService } from './notification/notification.service';
import { MeetingModule } from './meetings/meetings.module';
import { OkrController } from './okr/okr.controller';
import { OkrModule } from './okr/okr.module';
import { KeyResultsModule } from './key-results/key-results.module';
import { GoogleService } from './services/google.service';
import { BlobModule } from './blob/blob.module';
import { TeamModule } from './team/team.module';
import { RolesController } from './roles/roles.controller';
import { RolesModule } from './roles/roles.module';

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
    EmployeeModule,
    FeedbackModule,
    TagModule,
    NotificationModule,
    MeetingModule,
    OkrModule,
    KeyResultsModule,
    BlobModule,
    TeamModule,
    RolesModule,
  ],
  controllers: [
    AppController,
    AuthController,
    UserController,
    CompanyController,
    DepartmentController,
    EmployeeController,
    FeedbackController,
    NotificationController,
    OkrController,
    RolesController,
  ],
  providers: [AppService, NotificationService, GoogleService],
})
export class AppModule {}
