import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Issue, IssueStatus, IssueType, IssuePriority } from '../entities/issue.entity';
import { Delivery, DeliveryStatus } from '../entities/delivery.entity';
import { ProofOfDelivery } from '../entities/proof-of-delivery.entity';
import { User, UserRole } from '../../auth/entities/user.entity';

@Injectable()
export class IssueService {
  constructor(
    @InjectRepository(Issue)
    private issueRepository: Repository<Issue>,
    @InjectRepository(Delivery)
    private deliveryRepository: Repository<Delivery>,
    @InjectRepository(ProofOfDelivery)
    private proofOfDeliveryRepository: Repository<ProofOfDelivery>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createIssue(reporterId: string, data: {
    deliveryId: string;
    type: IssueType;
    priority: IssuePriority;
    title: string;
    description: string;
    attachments?: string[];
  }): Promise<Issue> {
    const delivery = await this.deliveryRepository.findOne({ where: { id: data.deliveryId } });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    // Verify reporter is either customer or rider of this delivery
    const user = await this.userRepository.findOne({ where: { id: reporterId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCustomer = delivery.customerId === reporterId;
    const isRider = delivery.riderId === reporterId;
    
    if (!isCustomer && !isRider) {
      throw new ForbiddenException('You can only report issues for your own deliveries');
    }

    const issue = this.issueRepository.create({
      deliveryId: data.deliveryId,
      reporterId,
      type: data.type,
      priority: data.priority,
      title: data.title,
      description: data.description,
      attachments: data.attachments || [],
      status: IssueStatus.OPEN,
    });

    return this.issueRepository.save(issue);
  }

  async getUserIssues(userId: string, status?: string): Promise<any[]> {
    const query = this.issueRepository.createQueryBuilder('issue')
      .where('issue.reporterId = :userId', { userId })
      .leftJoinAndSelect('issue.delivery', 'delivery')
      .leftJoinAndSelect('issue.reporter', 'reporter')
      .leftJoinAndSelect('issue.assignedTo', 'assignedTo')
      .orderBy('issue.createdAt', 'DESC');

    if (status) {
      query.andWhere('issue.status = :status', { status });
    }

    return query.getMany();
  }

  async getAssignedIssues(userId: string, status?: string): Promise<any[]> {
    const query = this.issueRepository.createQueryBuilder('issue')
      .where('issue.assignedToId = :userId', { userId })
      .leftJoinAndSelect('issue.delivery', 'delivery')
      .leftJoinAndSelect('issue.reporter', 'reporter')
      .leftJoinAndSelect('issue.assignedTo', 'assignedTo')
      .orderBy('issue.createdAt', 'DESC');

    if (status) {
      query.andWhere('issue.status = :status', { status });
    }

    return query.getMany();
  }

  async getAllIssues(status?: string, priority?: string): Promise<any[]> {
    const query = this.issueRepository.createQueryBuilder('issue')
      .leftJoinAndSelect('issue.delivery', 'delivery')
      .leftJoinAndSelect('issue.reporter', 'reporter')
      .leftJoinAndSelect('issue.assignedTo', 'assignedTo')
      .orderBy('issue.createdAt', 'DESC');

    if (status) {
      query.andWhere('issue.status = :status', { status });
    }

    if (priority) {
      query.andWhere('issue.priority = :priority', { priority });
    }

    return query.getMany();
  }

  async getIssueById(issueId: string): Promise<any> {
    const issue = await this.issueRepository.findOne({
      where: { id: issueId },
      relations: { delivery: true, reporter: true, assignedTo: true },
    });
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }
    return issue;
  }

  async assignIssue(issueId: string, adminId: string, assignedToId: string): Promise<any> {
    const issue = await this.issueRepository.findOne({ where: { id: issueId } });
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    const assignee = await this.userRepository.findOne({ where: { id: assignedToId } });
    if (!assignee) {
      throw new NotFoundException('Assignee not found');
    }

    issue.assignedToId = assignedToId;
    issue.status = IssueStatus.IN_PROGRESS;
    await this.issueRepository.save(issue);

    return this.getIssueById(issueId);
  }

  async updateIssueStatus(issueId: string, userId: string, status: string, resolution?: string): Promise<any> {
    const issue = await this.issueRepository.findOne({ where: { id: issueId } });
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    // Verify user can update this issue
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const isReporter = issue.reporterId === userId;
    const isAssignee = issue.assignedToId === userId;
    const isAdmin = user?.role === 'admin';

    if (!isReporter && !isAssignee && !isAdmin) {
      throw new ForbiddenException('You can only update your own issues');
    }

    issue.status = status as IssueStatus;
    if (resolution) {
      issue.resolution = resolution;
    }
    if (status === IssueStatus.RESOLVED || status === IssueStatus.CLOSED) {
      issue.resolvedAt = new Date();
    }

    await this.issueRepository.save(issue);
    return this.getIssueById(issueId);
  }

  async addComment(issueId: string, userId: string, comment: string): Promise<any> {
    // In a real implementation, you'd have a separate comments table
    // For now, we'll just return the issue
    return this.getIssueById(issueId);
  }
}