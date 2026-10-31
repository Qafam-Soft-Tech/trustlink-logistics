import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { AppModule } from '../app.module';
import { KycStatus, User, UserRole } from '../modules/auth/entities/user.entity';

async function seedAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const phone = process.env.ADMIN_PHONE?.trim() || '08000000000';

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set to seed an admin user');
  }
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters');
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const dataSource = app.get(DataSource);
    const users = dataSource.getRepository(User);

    let user = await users.findOne({ where: { email } });
    if (!user) {
      user = await users.findOne({ where: { phone } });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    if (!user) {
      user = users.create({
        email,
        phone,
        firstName: 'TrustLink',
        lastName: 'Admin',
        role: UserRole.ADMIN,
        passwordHash,
        isPhoneVerified: true,
        isActive: true,
        kycStatus: KycStatus.APPROVED,
      });
    } else {
      user.email = email;
      user.phone = phone;
      user.role = UserRole.ADMIN;
      user.passwordHash = passwordHash;
      user.isPhoneVerified = true;
      user.isActive = true;
      user.kycStatus = KycStatus.APPROVED;
    }

    await users.save(user);
    console.log(`Admin ready: ${email}`);
  } finally {
    await app.close();
  }
}

seedAdmin().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
