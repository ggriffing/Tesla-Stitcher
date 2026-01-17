# Tesla Sentry Viewer

## Overview

A 3D visualization application for Tesla Sentry Mode dashcam footage. The app allows users to create projects, upload dashcam videos from four camera angles (front, back, left, right), and view them synchronized in a 3D space. It includes support for extracting SEI metadata (speed, GPS, telemetry) from Tesla dashcam files using a Python script.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: TanStack React Query for server state
- **3D Rendering**: React Three Fiber + Three.js + Drei helpers
- **UI Components**: Custom cyberpunk-themed components built on shadcn/ui (Radix primitives)
- **Styling**: Tailwind CSS with custom CSS variables for theming

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (compiled with tsx for development, esbuild for production)
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod validation
- **Build System**: Vite for frontend, esbuild for backend bundling

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Drizzle Kit (`drizzle-kit push` for schema sync)
- **Main Entity**: Projects table storing name, description, and layout configuration (JSONB for 3D positioning data)

### Key Design Patterns
- **Shared Types**: Schema and API routes shared between client/server in `shared/` directory
- **Type-safe API**: Zod schemas define request/response types with runtime validation
- **Video Handling**: Client-side URL.createObjectURL() for large local video files (no server upload)
- **3D Layout Persistence**: Camera positions, rotations, and sync offsets stored as JSON in database

### Python Integration
- SEI metadata extraction script (`server/scripts/sei_extractor.py`) for Tesla dashcam protobuf data
- Requires protobuf library and compiled `.proto` definitions

## External Dependencies

### Database
- PostgreSQL (connection via `DATABASE_URL` environment variable)
- Drizzle ORM for queries and schema management

### Frontend Libraries
- Three.js ecosystem (@react-three/fiber, @react-three/drei) for 3D visualization
- Radix UI primitives for accessible components
- TanStack Query for data fetching

### Build Tools
- Vite with React plugin for frontend development
- esbuild for production server bundling
- Replit-specific plugins for development (cartographer, dev-banner, error overlay)

### Python Requirements
- protobuf library for SEI metadata extraction
- Compiled dashcam.proto definitions (dashcam_pb2.py)