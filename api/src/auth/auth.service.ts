import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { LoginDto, ChangePasswordDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({
      where: { email: dto.email, isActive: true },
      relations: ['company'],
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        companyId: user.companyId,
        company: user.company,
      },
    };
  }

  async me(userId: number) {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['company'],
    });
    if (!user) throw new UnauthorizedException();
    const { passwordHash, ...safe } = user as any;
    return safe;
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersRepo.save(user);
    return { message: 'Password updated' };
  }

  async listUsers(companyId: number) {
    return this.usersRepo.find({
      where: { companyId },
      select: ['id', 'email', 'fullName', 'role', 'isActive', 'createdAt'],
    });
  }

  async createUser(companyId: number, data: any) {
    const exists = await this.usersRepo.findOne({ where: { email: data.email } });
    if (exists) throw new BadRequestException('Email already in use');
    const hash = await bcrypt.hash(data.password, 10);
    const user = this.usersRepo.create({
      companyId,
      email: data.email,
      passwordHash: hash,
      fullName: data.fullName || null,
      role: data.role || 'user',
    });
    return this.usersRepo.save(user);
  }
}
