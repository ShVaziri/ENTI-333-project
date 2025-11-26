# UCalgary Student Textbook Marketplace

## Overview

The UCalgary Student Textbook Marketplace is a campus-specific web application that enables University of Calgary students to buy and sell used textbooks. The platform provides a safe, student-focused marketplace with features including course code search, real-time messaging between buyers and sellers, listing management, and image uploads for textbook listings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and development server.

**UI Component System**: Shadcn UI component library built on Radix UI primitives with Tailwind CSS for styling. The design follows a "New York" style variant with custom theming focused on a clean, modern marketplace aesthetic inspired by Airbnb and Facebook Marketplace.

**Routing**: Client-side routing using Wouter for lightweight navigation between pages (Landing, Home, Listing Detail, Post Listing, Messages, Dashboard).

**State Management**: TanStack Query (React Query) for server state management with optimistic updates and caching. Authentication state managed through a custom `useAuth` hook.

**Form Handling**: React Hook Form with Zod schema validation for type-safe form submissions.

**Design System**: Custom Tailwind configuration with HSL-based color system, consistent spacing units (2, 4, 6, 8, 12, 16), and Inter font family. Component library includes cards, badges, buttons, dialogs, and other marketplace-specific elements.

### Backend Architecture

**Framework**: Express.js server with TypeScript running on Node.js.

**Development/Production Split**: Separate entry points (`index-dev.ts` using Vite middleware for HMR, `index-prod.ts` serving static built files).

**API Design**: RESTful API with endpoints for listings, messages, conversations, and user management. All routes protected by authentication middleware.

**Authentication**: Replit Auth integration using OpenID Connect (OIDC) with Passport.js strategy. Session management via `express-session` with PostgreSQL session store.

**Data Access Layer**: Storage abstraction interface (`IStorage`) implemented by `DatabaseStorage` class, providing clean separation between business logic and data persistence.

**Error Handling**: Centralized error handling with Zod validation errors transformed to user-friendly messages.

### Data Storage

**Database**: PostgreSQL (via Neon serverless driver) accessed through Drizzle ORM.

**Schema Design**: 
- Users table (integrated with Replit Auth)
- Listings table (textbook postings with course codes, prices, conditions, images)
- Messages table (buyer-seller communications)
- Sessions table (authentication session storage)

**ORM Strategy**: Drizzle ORM with type-safe schema definitions and migrations. Schema shared between client and server via `@shared/schema` path alias.

**File Storage**: Google Cloud Storage integration for textbook images with custom ACL (Access Control List) policy system for private/public object management.

### Authentication & Authorization

**Authentication Provider**: Replit Auth (OIDC-based) providing seamless authentication for Replit-hosted applications.

**Session Management**: Server-side sessions stored in PostgreSQL with 7-day TTL, HTTP-only secure cookies.

**User Model**: Automatic user creation/update on login with email, first name, last name, and profile image extracted from OIDC claims.

**Authorization Pattern**: Middleware-based (`isAuthenticated`) protecting all API routes. User ownership verified for listing modifications and message access.

### External Dependencies

**Third-Party Services**:
- Google Cloud Storage: Image/file uploads for textbook listings via Replit Object Storage sidecar
- Replit Auth: OAuth/OIDC authentication service
- Neon Database: Serverless PostgreSQL hosting

**Key Libraries**:
- Drizzle ORM: Type-safe database queries and schema management
- TanStack Query: Server state synchronization and caching
- Radix UI: Accessible component primitives
- Uppy: File upload interface (configured for AWS S3-compatible storage)
- React Hook Form + Zod: Form validation and type safety
- Tailwind CSS: Utility-first styling framework

**Development Tools**:
- Vite: Frontend build tool with HMR
- TypeScript: Type safety across full stack
- ESBuild: Production server bundling
- Replit-specific plugins: Cartographer (code navigation), dev banner, runtime error overlay