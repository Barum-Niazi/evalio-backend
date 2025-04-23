import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Request,
  Get,
  Res,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { LocalAuthGuard } from 'src/guards/local-auth.guard';
import { GoogleService } from '../services/google.service';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleService: GoogleService,
  ) {}

  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto) {
    console.log(signUpDto);
    const { name, email, password } = signUpDto;
    return this.authService.signUp(name, email, password);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Get('google')
  redirectToGoogle(@Res() res: Response) {
    const url = this.googleService.getAuthUrl();
    return res.redirect(url);
  }

  @Get('google/callback')
  @UseGuards(JwtAuthGuard)
  async googleAuthCallback(
    @Query('code') code: string,
    @Req() req,
    @Res() res: Response,
  ) {
    const tokens = await this.googleService.setCredentials(code);
    console.log(tokens);
    const userId = req.user.id; // test user id

    await this.authService.storeGoogleTokens(userId, tokens);

    return res.json({ message: 'Google OAuth successful' });
  }

  @UseGuards(JwtAuthGuard)
  @Get('google/link')
  googleLink(@Req() req, @Res() res: Response) {
    const url = this.googleService.getAuthUrl();
    return res.redirect(url);
  }
}
