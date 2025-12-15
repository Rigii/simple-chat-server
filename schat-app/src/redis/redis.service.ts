import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { strings } from './strings';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  public client: RedisClientType;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisHost = this.configService.get<string>('redis.host');
    const redisPort = this.configService.get<string>('redis.port');

    if (!redisHost || !redisPort) {
      throw new Error(strings.redisHostPortMustBeSet);
    }
    this.client = createClient({
      url: `redis://${redisHost}:${redisPort}`,
    });

    this.client.on('error', (err) =>
      this.logger.error(strings.redisClientError, err),
    );

    await this.client.connect();
    this.logger.log(strings.redisClientConnected);
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async get(key: string): Promise<string | null> {
    return (await this.client.get(key)) as Promise<string | null>;
  }
  async set(key: string, value: string, ttl?: number): Promise<void> {
    await this.client.set(key, value, { PX: ttl });
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }
}
