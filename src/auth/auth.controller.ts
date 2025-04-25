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
  redirectToGoogle(@Res() res: Response, @Query('jwt') jwt: string) {
    const state = encodeURIComponent(jwt);
    const url = this.googleService.getAuthUrl(state);
    return res.redirect(url);
  }

  @Get('google/callback')
  async googleAuthCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const jwt = decodeURIComponent(state);
    const decoded = await this.authService.verifyJwtToken(jwt);
    const userId = decoded.sub;

    const { tokens, email } = await this.googleService.setCredentials(code);
    await this.authService.storeGoogleTokens(userId, tokens, email);

    return res.send(`<script>window.close();</script>`);
  }
}
