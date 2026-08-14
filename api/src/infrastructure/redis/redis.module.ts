import { Global, Module, OnModuleDestroy, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client: Redis | null = null;
  private enabled = false;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('REDIS_URL') || 'redis://127.0.0.1:6380';
    try {
      this.client = new Redis(url, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy: () => null,
      });
      this.client.on('error', (err) => {
        this.enabled = false;
        this.logger.warn(`Redis error: ${err.message}`);
      });
      this.client.on('ready', () => {
        this.enabled = true;
        this.logger.log('Redis connected');
      });
    } catch {
      this.logger.warn('Redis init failed — caching disabled');
      this.client = null;
    }
  }

  get isReady() {
    return this.enabled && !!this.client;
  }

  async getJson<T>(key: string): Promise<T | null> {
    if (!this.isReady || !this.client) return null;
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds = 60) {
    if (!this.isReady || !this.client) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      /* ignore */
    }
  }

  async del(patternOrKey: string) {
    if (!this.isReady || !this.client) return;
    try {
      if (patternOrKey.includes('*')) {
        const keys = await this.client.keys(patternOrKey);
        if (keys.length) await this.client.del(...keys);
      } else {
        await this.client.del(patternOrKey);
      }
    } catch {
      /* ignore */
    }
  }

  async onModuleDestroy() {
    await this.client?.quit().catch(() => undefined);
  }
}

@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class RedisModule {}
