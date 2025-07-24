# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production version (automatically runs format before build)
- `npm start` - Start production server
- `npm run lint` - Run ESLint checks
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check if code is properly formatted
- `npm run fix-format` - Run the fix-formatting.sh script to auto-fix formatting issues
- `npm run ci-check` - Run comprehensive CI checks (format, lint, TypeScript)
- `npx prisma generate` - Generate Prisma client (runs automatically on postinstall)
- `npx prisma migrate dev` - Run database migrations
- `npx tsc --noEmit` - TypeScript type checking without compilation

## Project Architecture

This is a Next.js 15 navigation website (CZL Nav) built with TypeScript, featuring a public frontend and admin backend.

### Database & ORM

- Uses Prisma ORM with SQLite database
- Main models: Category, Service, Setting, Admin
- Database connection managed through `src/lib/prisma.ts` with singleton pattern
- Schema located at `prisma/schema.prisma`

### Application Structure

- **Frontend Routes** (`src/app/()`): Public-facing pages including home, category, and search
- **Admin Routes** (`src/app/admin/`): Protected admin interface with authentication
- **API Routes** (`src/app/api/`): RESTful endpoints for both public and admin functionality
- **Components** (`src/components/`): Reusable UI components including admin-specific components
- **Types** (`src/types/`): TypeScript definitions for Category, Service, and related interfaces

### Key Features

- Real-time search functionality via `/api/live-search`
- Click tracking for services via `/api/services/[id]/click`
- Admin panel with CRUD operations for categories and services
- Memory caching system (`src/lib/memory-cache.ts`)
- Image upload handling with custom utilities

### Authentication

- Simple admin authentication system using bcrypt
- Session management through custom `czl-auth.ts` utilities
- Protected admin routes with middleware

### Configuration

- ESLint with Next.js and Prettier integration
- Tailwind CSS for styling with shadcn/ui components
- Docker support with docker-compose.yml
- Custom build ID generation and cache control headers in next.config.js

## System Initialization

After deployment, visit `/api/init` to initialize the system with default admin account (admin/admin123) and categories.

## Code Quality

Before committing changes, run `npm run ci-check` to ensure all formatting, linting, and TypeScript checks pass. Use `npm run fix-format` to automatically fix most formatting issues.
