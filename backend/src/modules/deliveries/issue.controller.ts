import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { IssueService } from './services/issue.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../auth/entities/user.entity';
import { AssignIssueDto, CreateIssueDto, UpdateIssueStatusDto } from './dto';

@ApiTags('Issues')
@Controller('issues')
@UseGuards(JwtAuthGuard, RolesGuard)
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
  async getMyIssues(@CurrentUser() user: User, @Query('status') status?: string) {
    return this.issueService.getUserIssues(user.id, status);
  }

  @Get('assigned')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get issues assigned to me (admin)' })
  async getAssignedIssues(@CurrentUser() user: User, @Query('status') status?: string) {
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
  async getIssue(@CurrentUser() user: User, @Param('id') id: string) {
    const issue = await this.issueService.getIssueById(id);
    if (user.role === UserRole.ADMIN) return issue;
    if (issue.reporterId === user.id || issue.assignedToId === user.id) return issue;
    if (user.role === UserRole.RIDER && issue.delivery?.riderId === user.id) return issue;
    throw new ForbiddenException('Not authorized to view this issue');
  }

  @Put(':id/assign')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign issue to admin (admin)' })
  async assignIssue(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: AssignIssueDto,
  ) {
    return this.issueService.assignIssue(id, user.id, dto.assignedToId);
  }

  @Put(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update issue status (admin)' })
  async updateStatus(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateIssueStatusDto,
  ) {
    return this.issueService.updateIssueStatus(id, user.id, dto.status, dto.resolution);
  }
}
