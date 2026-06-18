import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

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
    });

    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    try {
      this.logger.log('Connecting to Supabase PostgreSQL…');
      await this.$connect();
      this.logger.log('Database connection established.');
    } catch (err) {
      this.logger.error('Database connection failed:', err);
      throw err;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
