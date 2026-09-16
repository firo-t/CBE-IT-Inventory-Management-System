import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true, branch: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 2. Check user status
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is inactive');
    }

    // 3. Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 4. Generate JWT
    const payload = { 
      sub: user.user_id, 
      email: user.email, 
      role: user.role?.role_name 
    };
    
    const accessToken = this.jwtService.sign(payload);

    // 5. Return safe user info
    return {
      access_token: accessToken,
      user: {
        id: user.user_id,
        fullName: user.full_name,
        employeeId: user.employee_id,
        email: user.email,
        phone: user.phone,
        role: user.role?.role_name,
        branchId: user.branch_id,
        branchName: user.branch?.branch_name,
        status: user.status,
      }
    };
  }
}
