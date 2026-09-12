import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { IssueService } from './services/issue.service';
import { Issue, IssueStatus, IssueType, IssuePriority } from './entities/issue.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../auth/entities/user.entity';

interface CreateIssueDto {
  deliveryId: string;
  type: IssueType;
  priority: IssuePriority;
  title: string;
  description: string;
  attachments?: string[];
}

interface UpdateIssueDto {
  status: IssueStatus;
  resolution?: string;
}

@ApiTags('Issues')
@Controller('issues')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IssueController {
  constructor(private issueService: IssueService) {}

  @Post()
  @Roles(UserRole.CUSTOMER, UserRole.RIDER)
  @ApiOperation({ summary: 'Report an issue' })
  async createIssue(@CurrentUser() user: User, @Body() dto: CreateIssueDto) {
    return this.issueService.createIssue(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get my reported issues' })
  async getMyIssues(
    @CurrentUser() user: User,
    @Query('status') status?: string,
  ) {
    return this.issueService.getUserIssues(user.id, status);
  }

  @Get('assigned')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get issues assigned to me (admin)' })
  async getAssignedIssues(
    @CurrentUser() user: User,
    @Query('status') status?: string,
  ) {
    return this.issueService.getAssignedIssues(user.id, status);
  }

  @Get('all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all issues (admin)' })
  async getAllIssues(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    return this.issueService.getAllIssues(status, priority);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get issue by ID' })
  async getIssue(@Param('id') id: string) {
    return this.issueService.getIssueById(id);
  }

  @Put(':id/assign')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign issue to admin (admin)' })
  async assignIssue(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: { assignedToId: string },
  ) {
    return this.issueService.assignIssue(id, user.id, body.assignedToId);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update issue status' })
  async updateStatus(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateIssueDto,
  ) {
    return this.issueService.updateIssueStatus(id, user.id, dto.status, dto.resolution);
  }
}