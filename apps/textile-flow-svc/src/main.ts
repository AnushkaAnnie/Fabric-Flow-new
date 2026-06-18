import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'https://fabric-flow-frontend.onrender.com',
      'http://localhost:3000',
      process.env.FRONTEND_URL ?? '',
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.getHttpAdapter().get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
