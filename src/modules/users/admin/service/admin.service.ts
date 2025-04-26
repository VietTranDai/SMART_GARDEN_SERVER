import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from '../entity/admin.entity';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { UpdateAdminDto } from '../dto/update-admin.dto';
import { AdminFilterDto } from '../dto/admin-filter.dto';
import { UsersService } from '../../users.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly usersService: UsersService,
  ) {}

  async create(createAdminDto: CreateAdminDto): Promise<Admin> {
    // Check if user exists
    const user = await this.usersService.findOne(createAdminDto.userId);

    // Check if user is already an admin
    const existingAdmin = await this.adminRepository.findOne({
      where: { user: { id: createAdminDto.userId } },
    });

    if (existingAdmin) {
      throw new ConflictException('User is already an admin');
    }

    // Create new admin
    const admin = this.adminRepository.create({
      user,
    });

    return this.adminRepository.save(admin);
  }

  async findAll(filterDto: AdminFilterDto): Promise<[Admin[], number]> {
    const { page, limit, sortBy, sortOrder } = filterDto;

    const query = this.adminRepository
      .createQueryBuilder('admin')
      .leftJoinAndSelect('admin.user', 'user')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(`admin.${sortBy}`, sortOrder);

    return query.getManyAndCount();
  }

  async findOne(id: number): Promise<Admin> {
    const admin = await this.adminRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    return admin;
  }

  async findByUserId(userId: number): Promise<Admin> {
    const admin = await this.adminRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!admin) {
      throw new NotFoundException(`Admin with user ID ${userId} not found`);
    }

    return admin;
  }

  async update(id: number, updateAdminDto: UpdateAdminDto): Promise<Admin> {
    const admin = await this.findOne(id);

    // Since admin entity doesn't have fields to update besides the user,
    // we don't need to update admin-specific fields

    return this.adminRepository.save(admin);
  }

  async remove(id: number): Promise<void> {
    const admin = await this.findOne(id);
    await this.adminRepository.remove(admin);
  }
}
