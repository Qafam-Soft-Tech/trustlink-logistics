import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { User } from '../auth/entities/user.entity';
import { OtpCode } from '../auth/entities/otp-code.entity';
import { RiderProfile } from '../deliveries/entities/rider-profile.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { OtpService } from './services/otp.service';
import { TermiiSmsService } from './services/termii-sms.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, OtpCode, RiderProfile]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'trustlink-secret-key'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN', '7d') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, OtpService, TermiiSmsService],
  exports: [AuthService, JwtModule, OtpService],
})
export class AuthModule {}