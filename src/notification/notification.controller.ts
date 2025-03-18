import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/notifcation.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Roles } from 'src/decorators/roles.decorators';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get(':userId')
  async getUserNotifications(@Param('userId') userId: number) {
    return this.notificationService.getUserNotifications(userId);
  }

  @Post()
  async createNotification(
    @Body() createNotificationDto: CreateNotificationDto,
  ) {
    return this.notificationService.create(
      createNotificationDto.userId,
      createNotificationDto.typeId,
      createNotificationDto.message,
      createNotificationDto.link,
    );
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: number) {
    return this.notificationService.markAsRead(id);
  }

  @Roles('Admin')
  @Delete(':id')
  async deleteNotification(@Param('id') id: number) {
    return this.notificationService.delete(id);
  }
}
