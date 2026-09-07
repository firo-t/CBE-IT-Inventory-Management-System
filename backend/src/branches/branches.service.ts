import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService, private auditLogsService: AuditLogsService) {}

  async create(createBranchDto: CreateBranchDto, user: any) {
    // Check for duplicate branch_code
    const existingBranch = await this.prisma.branch.findUnique({
      where: { branch_code: createBranchDto.branch_code },
    });
    if (existingBranch) {
      throw new ConflictException('Branch code already exists');
    }

    // Check manager validation if supplied
    if (createBranchDto.manager_id) {
      await this.validateManager(createBranchDto.manager_id);
    }

    const branch = await this.prisma.branch.create({
      data: {
        branch_code: createBranchDto.branch_code,
        branch_name: createBranchDto.branch_name,
        manager_id: createBranchDto.manager_id,
        contact_person: createBranchDto.contact_person,
        phone: createBranchDto.phone,
        location: createBranchDto.location,
      },
      include: {
        manager: {
          select: {
            user_id: true,
            full_name: true,
            employee_id: true,
            email: true,
            phone: true,
            status: true,
            role: true,
          }
        }
      }
    });

    await this.auditLogsService.createLog(this.prisma, {
      user_id: user.userId,
      action: 'CREATE',
      entity_type: 'BRANCH',
      entity_id: branch.branch_id,
      new_value: { branch_code: branch.branch_code, branch_name: branch.branch_name, manager_id: branch.manager_id }
    });

    return branch;
  }

  async findAll() {
    return this.prisma.branch.findMany({
      include: {
        manager: {
          select: {
            user_id: true,
            full_name: true,
            employee_id: true,
            email: true,
            phone: true,
            status: true,
            role: true,
          }
        }
      }
    });
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { branch_id: id },
      include: {
        manager: {
          select: {
            user_id: true,
            full_name: true,
            employee_id: true,
            email: true,
            phone: true,
            status: true,
            role: true,
          }
        }
      }
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return branch;
  }

  async update(id: string, updateBranchDto: UpdateBranchDto, user: any) {
    // Check if branch exists
    const previous = await this.findOne(id);

    // Check for duplicate branch_code if being updated
    if (updateBranchDto.branch_code) {
      const existing = await this.prisma.branch.findUnique({
        where: { branch_code: updateBranchDto.branch_code },
      });
      if (existing && existing.branch_id !== id) {
        throw new ConflictException('Branch code already exists');
      }
    }

    // Check manager validation if supplied
    if (updateBranchDto.manager_id) {
      await this.validateManager(updateBranchDto.manager_id, id);
    }

    try {
      const branch = await this.prisma.branch.update({
        where: { branch_id: id },
        data: {
          branch_code: updateBranchDto.branch_code,
          branch_name: updateBranchDto.branch_name,
          manager_id: updateBranchDto.manager_id,
          contact_person: updateBranchDto.contact_person,
          phone: updateBranchDto.phone,
          location: updateBranchDto.location,
        },
        include: {
          manager: {
            select: {
              user_id: true,
              full_name: true,
              employee_id: true,
              email: true,
              phone: true,
              status: true,
              role: true,
            }
          }
        }
      });

      await this.auditLogsService.createLog(this.prisma, {
        user_id: user.userId,
        action: 'UPDATE',
        entity_type: 'BRANCH',
        entity_id: id,
        previous_value: { branch_code: previous.branch_code, branch_name: previous.branch_name, manager_id: previous.manager_id },
        new_value: { branch_code: branch.branch_code, branch_name: branch.branch_name, manager_id: branch.manager_id }
      });

      return branch;
    } catch (error: any) {
      // Catch unique constraint violation on manager_id in Prisma (P2002)
      if (error.code === 'P2002') {
        throw new ConflictException('Unique constraint failed. The manager might already be assigned to another branch.');
      }
      throw error;
    }
  }

  // Private helper to validate manager rules
  private async validateManager(managerId: string, currentBranchId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: managerId },
      include: { role: true }
    });

    if (!user) {
      throw new NotFoundException('Manager user not found');
    }

    if (user.role?.role_name !== 'Branch Manager') {
      throw new BadRequestException('User does not have the Branch Manager role');
    }

    // Ensure the manager is not already managing another branch
    const existingManagedBranch = await this.prisma.branch.findUnique({
      where: { manager_id: managerId }
    });

    if (existingManagedBranch && existingManagedBranch.branch_id !== currentBranchId) {
      throw new ConflictException('This user is already a manager of another branch');
    }
  }
}
