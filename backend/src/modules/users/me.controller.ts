import { Controller, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../auth/entities/user.entity';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MeController {
  constructor(private usersService: UsersService) {}

  @Delete('me')
  @Roles(UserRole.CUSTOMER, UserRole.RIDER)
  @ApiOperation({ summary: 'Delete (anonymize) the current account' })
  async deleteMe(@CurrentUser() user: User) {
    return this.usersService.deleteAccount(user.id);
  }
}
