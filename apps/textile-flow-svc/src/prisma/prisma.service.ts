import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { normalizeEmptyStrings } from './normalize-empty-strings.util';

export type PrismaTransaction = Prisma.TransactionClient;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        'DATABASE_URL is not set. ' +
          'Copy apps/textile-flow-svc/.env.example to .env and fill in your Supabase credentials.',
      );
    }

    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }, // required for Supabase
      connectionTimeoutMillis: 5000, // fail fast if DB unreachable (default is ~22s which causes frontend NETWORK errors)
      idleTimeoutMillis: 30000, // release idle connections after 30s
    });

    const adapter = new PrismaPg(pool);
    super({ adapter });

    const extendedClient = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ operation, args, query }) {
            if (operation === 'create' || operation === 'update') {
              const typedArgs = args as { data?: unknown };
              if (typedArgs.data) {
                typedArgs.data = normalizeEmptyStrings(typedArgs.data);
              }
            }
            return query(args);
          },
        },
      },
    });

    return new Proxy(this, {
      get: (target, prop) => {
        if (prop in extendedClient) {
          return (extendedClient as Record<string | symbol, unknown>)[prop];
        }
        return (target as Record<string | symbol, unknown>)[prop];
      },
    });
  }

  async onModuleInit() {
    this.logger.log('Probing Supabase PostgreSQL connection…');
    try {
      // $connect() is a no-op with PrismaPg adapter — run a real query to confirm reachability
      await this.$queryRaw`SELECT 1`;
      this.logger.log('Database connection established ✓');
    } catch {
      // Log as WARNING (not ERROR) so the app still boots and /health still works.
      // DB-dependent routes will return 400 until the network issue is resolved.
      // Fix: switch to mobile hotspot or VPN (ports 5432/6543 blocked by ISP/router).
      this.logger.warn(
        'Database unreachable on startup — DB routes will fail until network is fixed. ' +
          'Switch to mobile hotspot or VPN to unblock PostgreSQL ports 5432/6543.',
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
