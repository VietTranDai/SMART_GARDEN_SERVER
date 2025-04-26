import { Injectable} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LocationService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}
}
