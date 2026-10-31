import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { User, UserRole } from './entities/user.entity';
import { OtpCode } from './entities/otp-code.entity';
import { OtpService } from './services/otp.service';
import { RiderProfile, VehicleType } from '../deliveries/entities/rider-profile.entity';
import {
  AdminLoginDto,
  LoginDto,
  ProfileSetupDto,
  SignupDto,
  UpdateProfileDto,
  VerifyOtpDto,
} from './dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OtpCode)
    private otpRepository: Repository<OtpCode>,
    @InjectRepository(RiderProfile)
    private riderProfileRepository: Repository<RiderProfile>,
    private jwtService: JwtService,
    private otpService: OtpService,
  ) {}

  async signup(dto: SignupDto) {
    if (dto.role !== UserRole.CUSTOMER && dto.role !== UserRole.RIDER) {
      throw new BadRequestException('role must be customer or rider');
    }

    const existingUser = await this.userRepository.findOne({ where: { phone: dto.phone } });
    if (existingUser) {
      if (existingUser.role === dto.role) {
        throw new ConflictException('User with this phone and role already exists');
      }
      throw new ConflictException('Phone number already registered with a different role');
    }

    const user = this.userRepository.create({
      phone: dto.phone,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      role: dto.role,
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

  async adminLogin(dto: AdminLoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email, role: UserRole.ADMIN },
    });

    if (!user || !user.passwordHash || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const matches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  async resendOtp(phone: string, purpose: 'signup' | 'login' | 'reset' = 'signup') {
    await this.otpService.sendOtp(phone, purpose);
    return { message: 'OTP resent successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (dto.phone && dto.phone !== user.phone) {
      throw new BadRequestException('Phone number cannot be changed');
    }
    if (dto.role && dto.role !== user.role) {
      throw new BadRequestException('Role cannot be changed');
    }

    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;

    await this.userRepository.save(user);
    return this.sanitizeUser(user);
  }

  async setupProfile(userId: string, dto: ProfileSetupDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    user.firstName = dto.firstName;
    user.lastName = dto.lastName;
    if (dto.email !== undefined) user.email = dto.email;
    await this.userRepository.save(user);

    if (user.role === UserRole.RIDER && (dto.vehicleType || dto.vehiclePlate)) {
      let riderProfile = await this.riderProfileRepository.findOne({ where: { userId } });
      if (!riderProfile) {
        riderProfile = this.riderProfileRepository.create({
          userId,
          vehicleType: dto.vehicleType ?? VehicleType.MOTORCYCLE,
          vehiclePlate: dto.vehiclePlate ?? '',
        });
      } else {
        if (dto.vehicleType) riderProfile.vehicleType = dto.vehicleType;
        if (dto.vehiclePlate !== undefined) riderProfile.vehiclePlate = dto.vehiclePlate;
      }
      await this.riderProfileRepository.save(riderProfile);
    }

    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  private generateToken(user: User): string {
    const payload = { sub: user.id, phone: user.phone, role: user.role };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: User) {
    const { passwordHash: _passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
