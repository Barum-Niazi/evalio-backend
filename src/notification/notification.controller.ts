import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/notifcation.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Roles } from 'src/decorators/roles.decorators';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getUserNotifications(@Request() req) {
    req.user.id = parseInt(req.user.id.toString(), 10);
    const userId = req.user.id;
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
