import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

export type PrismaTransaction = Prisma.TransactionClient;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    console.log('Connecting to database with URL:', process.env.DATABASE_URL);
    const pool = new Pool({
      connectionString:
        'postgresql://postgres.nvtyytyykdjhgtinhftd:Anushka1326@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true',
      ssl: { rejectUnauthorized: false }, // ensure ssl is required for supabase
    });

    // The adapter translates Prisma's internal queries to use the pool
    const adapter = new PrismaPg(pool);

    // Pass the adapter to the PrismaClient constructor
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
