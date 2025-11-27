# UCalgary Student Textbook Marketplace

A campus-exclusive web application that enables University of Calgary students to buy and sell used textbooks. Built as part of ENTI 333 coursework.

![UCalgary Books](https://img.shields.io/badge/UCalgary-Textbook%20Marketplace-D11242)

## Features

### For Students
- **Browse Textbooks** - Search and filter listings by course code, condition, and price range
- **Post Listings** - Create listings with textbook images, course codes, and descriptions
- **Built-in Messaging** - Contact sellers directly through the platform
- **Seller Dashboard** - Manage your active listings and mark items as sold

### For Admins
- **Analytics Dashboard** - Track user signups, listing counts, and conversation metrics
- **7-Day Trends** - View charts showing user and listing growth over time
- **Success Metrics** - Monitor sold vs active listings and average messages per conversation

### Security
- **UCalgary-Only Access** - Authentication restricted to @ucalgary.ca email addresses
- **Secure Sessions** - Server-side session management with PostgreSQL storage

## Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** for build tooling and hot module replacement
- **Tailwind CSS** for styling
- **Shadcn UI** component library (Radix UI primitives)
- **TanStack Query** for server state management
- **Wouter** for client-side routing
- **React Hook Form** with Zod validation

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** for type-safe database queries
- **PostgreSQL** (Neon serverless) for data persistence
- **Passport.js** with OpenID Connect for authentication

### Design
- UCalgary official colors (Red #D11242, Gold #FFCD00)
- Calgary downtown skyline hero imagery
- Responsive, mobile-friendly layout

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and helpers
├── server/                 # Backend Express server
│   ├── routes.ts           # API endpoints
│   ├── storage.ts          # Database operations
│   └── replitAuth.ts       # Authentication setup
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Drizzle ORM schema definitions
└── attached_assets/        # Static images and assets
```

## Database Schema

- **users** - Student accounts with UCalgary email
- **listings** - Textbook listings with course codes, prices, conditions
- **messages** - Buyer-seller communications
- **sessions** - Authentication session storage

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/listings` | Get all active listings |
| GET | `/api/listings/:id` | Get single listing details |
| POST | `/api/listings` | Create new listing |
| PATCH | `/api/listings/:id` | Update listing |
| DELETE | `/api/listings/:id` | Delete listing |
| GET | `/api/conversations` | Get user's conversations |
| GET | `/api/messages/:odherUserId/:listingId` | Get messages in conversation |
| POST | `/api/messages` | Send a message |
| GET | `/api/admin/stats` | Get admin analytics (admin only) |

## Running Locally

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (DATABASE_URL, SESSION_SECRET)
4. Push database schema: `npm run db:push`
5. Start development server: `npm run dev`

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secret for session encryption
- `REPLIT_DEPLOYMENT` - Set when deployed on Replit

## Author

**Shayan Vaziri**  
University of Calgary  
ENTI 333 Project

## License

This project is for educational purposes as part of ENTI 333 coursework at the University of Calgary.
