
import Redis from 'ioredis';
import { config } from '../config';

export class RedisClient {
    private client: Redis;
    private static instance: RedisClient;

    private constructor() {
        this.client = new Redis({
            host: config.redis.host,
            port: config.redis.port,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        });

        this.client.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });

        this.client.on('connect', () => {
            console.log('Redis Client Connected');
        });
    }

    public static getInstance(): RedisClient {
        if (!RedisClient.instance) {
            RedisClient.instance = new RedisClient();
        }
        return RedisClient.instance;
    }

    async get(key: string): Promise<string | null> {
        return this.client.get(key);
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (ttlSeconds) {
            await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
            await this.client.set(key, value);
        }
    }

    async del(key: string): Promise<void> {
        await this.client.del(key);
    }

    async delPattern(pattern: string): Promise<void> {
        const stream = this.client.scanStream({ match: pattern });
        stream.on('data', async (keys) => {
            if (keys.length) {
                const pipeline = this.client.pipeline();
                keys.forEach((key: string) => {
                    pipeline.del(key);
                });
                await pipeline.exec();
            }
        });
    }

    async quit(): Promise<void> {
        await this.client.quit();
    }
}
