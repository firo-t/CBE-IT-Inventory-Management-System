import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto, UpdateUserStatusDto } from './dto/user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private auditLogsService: AuditLogsService) {}

  async create(createUserDto: CreateUserDto, userObj: any) {
    // 1. Verify Role exists
    const role = await this.prisma.role.findUnique({ where: { role_id: createUserDto.role_id } });
    if (!role) {
      throw new BadRequestException('Invalid role ID');
    }

    // 2. Verify Branch exists (if provided)
    if (createUserDto.branch_id) {
      const branch = await this.prisma.branch.findUnique({ where: { branch_id: createUserDto.branch_id } });
      if (!branch) {
        throw new BadRequestException('Invalid branch ID');
      }
    }

    // 3. Handle Duplicates
    const existingEmail = await this.prisma.user.findUnique({ where: { email: createUserDto.email } });
    if (existingEmail) {
      throw new ConflictException('Email already in use');
    }

    const existingEmployee = await this.prisma.user.findUnique({ where: { employee_id: createUserDto.employee_id } });
    if (existingEmployee) {
      throw new ConflictException('Employee ID already in use');
    }

    // 4. Hash password
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    // 5. Create user
    const { password, ...userData } = createUserDto;
    const user = await this.prisma.user.create({
      data: {
        ...userData,
        password_hash: passwordHash,
      },
      include: { role: true, branch: true },
    });

    await this.auditLogsService.createLog(this.prisma, {
      user_id: userObj.userId,
      action: 'CREATE',
      entity_type: 'USER',
      entity_id: user.user_id,
      new_value: { email: user.email, employee_id: user.employee_id, role_id: user.role_id, branch_id: user.branch_id }
    });

    return this.mapSafeUser(user);
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: { role: true, branch: true },
    });
    return users.map(this.mapSafeUser);
  }

  async getRoles() {
    return this.prisma.role.findMany({
      select: {
        role_id: true,
        role_name: true,
        description: true,
      },
      orderBy: { role_name: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: id },
      include: { role: true, branch: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapSafeUser(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto, userObj: any) {
    // Verify user exists
    const previous = await this.findOne(id);

    // Check duplicates if updating email/employee_id
    if (updateUserDto.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: updateUserDto.email } });
      if (existing && existing.user_id !== id) throw new ConflictException('Email already in use');
    }
    if (updateUserDto.employee_id) {
      const existing = await this.prisma.user.findUnique({ where: { employee_id: updateUserDto.employee_id } });
      if (existing && existing.user_id !== id) throw new ConflictException('Employee ID already in use');
    }

    // Check role/branch exist
    if (updateUserDto.role_id) {
      const role = await this.prisma.role.findUnique({ where: { role_id: updateUserDto.role_id } });
      if (!role) throw new BadRequestException('Invalid role ID');
    }
    if (updateUserDto.branch_id) {
      const branch = await this.prisma.branch.findUnique({ where: { branch_id: updateUserDto.branch_id } });
      if (!branch) throw new BadRequestException('Invalid branch ID');
    }

    const user = await this.prisma.user.update({
      where: { user_id: id },
      data: updateUserDto,
      include: { role: true, branch: true },
    });

    await this.auditLogsService.createLog(this.prisma, {
      user_id: userObj.userId,
      action: 'UPDATE',
      entity_type: 'USER',
      entity_id: id,
      previous_value: { email: previous.email, role_id: previous.role_id, branch_id: previous.branch_id },
      new_value: { email: user.email, role_id: user.role_id, branch_id: user.branch_id }
    });

    return this.mapSafeUser(user);
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto, userObj: any) {
    await this.findOne(id);
    const passwordHash = await bcrypt.hash(changePasswordDto.new_password, 10);

    const user = await this.prisma.user.update({
      where: { user_id: id },
      data: { password_hash: passwordHash },
      include: { role: true, branch: true },
    });

    await this.auditLogsService.createLog(this.prisma, {
      user_id: userObj.userId,
      action: 'UPDATE_PASSWORD',
      entity_type: 'USER',
      entity_id: id,
    });

    return this.mapSafeUser(user);
  }

  async updateStatus(id: string, updateStatusDto: UpdateUserStatusDto, userObj: any) {
    const previous = await this.findOne(id);

    // Self-protection logic could be added here to prevent deactivating last admin
    // For Phase 5 we'll do simple status update unless user requests specific last-admin checks

    const user = await this.prisma.user.update({
      where: { user_id: id },
      data: { status: updateStatusDto.status },
      include: { role: true, branch: true },
    });

    await this.auditLogsService.createLog(this.prisma, {
      user_id: userObj.userId,
      action: 'UPDATE_STATUS',
      entity_type: 'USER',
      entity_id: id,
      previous_value: { status: previous.status },
      new_value: { status: user.status }
    });

    return this.mapSafeUser(user);
  }

  // Helper function to safely strip out the password hash
  private mapSafeUser(user: any) {
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }
}
