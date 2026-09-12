import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { User, UserRole } from './entities/user.entity';
import { OtpCode } from './entities/otp-code.entity';
import { OtpService } from './services/otp.service';

export interface SignupDto {
  phone: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  email?: string;
}

export interface VerifyOtpDto {
  phone: string;
  code: string;
}

export interface LoginDto {
  phone: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OtpCode)
    private otpRepository: Repository<OtpCode>,
    private jwtService: JwtService,
    private otpService: OtpService,
  ) {}

  async signup(dto: SignupDto) {
    const existingUser = await this.userRepository.findOne({ where: { phone: dto.phone } });
    if (existingUser) {
      if (existingUser.role === dto.role) {
        throw new ConflictException('User with this phone and role already exists');
      }
      throw new ConflictException('Phone number already registered with a different role');
    }

    const user = this.userRepository.create({
      ...dto,
      isPhoneVerified: false,
    });
    await this.userRepository.save(user);

    await this.otpService.sendOtp(dto.phone, 'signup');

    return { message: 'OTP sent to phone number', userId: user.id };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const isValid = await this.otpService.verifyOtp(dto.phone, dto.code, 'signup');
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const user = await this.userRepository.findOne({ where: { phone: dto.phone } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    user.isPhoneVerified = true;
    await this.userRepository.save(user);

    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({ where: { phone: dto.phone } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isPhoneVerified) {
      throw new UnauthorizedException('Phone not verified');
    }

    await this.otpService.sendOtp(dto.phone, 'login');

    return { message: 'OTP sent to phone number', userId: user.id };
  }

  async verifyLoginOtp(dto: VerifyOtpDto) {
    const isValid = await this.otpService.verifyOtp(dto.phone, dto.code, 'login');
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const user = await this.userRepository.findOne({ where: { phone: dto.phone } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, data: Partial<User>) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (data.phone && data.phone !== user.phone) {
      throw new BadRequestException('Phone number cannot be changed');
    }
    if (data.role && data.role !== user.role) {
      throw new BadRequestException('Role cannot be changed');
    }

    Object.assign(user, data);
    await this.userRepository.save(user);
    return this.sanitizeUser(user);
  }

  private generateToken(user: User): string {
    const payload = { sub: user.id, phone: user.phone, role: user.role };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: User) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}