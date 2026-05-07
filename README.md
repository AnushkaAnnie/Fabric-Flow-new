# Textile Flow

A consolidated Turborepo monorepo for **Chhavineetu Textiles LLP**. 

Textile Flow handles the complete yarn-to-fabric lifecycle tracking, including:
- Master Data (Mills, Knitters, Dyers, Colours, Yarn Qualities, etc.)
- Transactional workflows (Yarn Lots, Delivery Notes, Knitting Programs, Dyeing Programs)
- Audit Logging for all system operations

## Architecture

This repository consists of:
- `apps/frontend`: A Next.js static export frontend.
- `apps/textile-flow-svc`: A unified NestJS backend service.
- `packages/shared`: A shared DTO/interface library.

## Development

```bash
npm install
npx turbo dev
```
