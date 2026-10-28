
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorService,
} from '@nestjs/terminus';

import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly healthIndicator: HealthIndicatorService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      async () => {
        const database = this.healthIndicator.check('database');

        try {
          await this.prisma.$queryRaw`SELECT 1`;
          return database.up();
        } catch {
          return database.down({
            message: 'Database connection failed',
          });
        }
      },
    ]);
  }
}
