import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);

  private readonly client: RedisClientType = createClient({
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  });

  async onModuleInit(): Promise<void> {
    this.client.on('error', (error) => {
      this.logger.error(`Redis error: ${error.message}`);
    });

    await this.client.connect();
    this.logger.log('Connected to Redis');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.close();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);

    if (value === null) {
      return null;
    }

    return JSON.parse(value) as T;
  }

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    await this.client.set(key, JSON.stringify(value), {
      EX: ttlSeconds,
    });
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async deleteByPattern(pattern: string): Promise<void> {
    for await (const keys of this.client.scanIterator({
      MATCH: pattern,
      COUNT: 100,
    })) {
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    }
  }
}
