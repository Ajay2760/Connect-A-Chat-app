# Connect Chat Application

## Overview

Connect is a real-time chat application built with a React frontend, Express backend, and PostgreSQL database. The application provides instant messaging capabilities with user authentication, conversation management, and real-time communication through WebSockets.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety
- **Vite** as the build tool for fast development and optimized production builds
- **Tailwind CSS** with shadcn/ui components for consistent UI design
- **Wouter** for client-side routing
- **TanStack Query** for server state management and caching
- **WebSocket** integration for real-time messaging

### Backend Architecture
- **Express.js** with TypeScript for the REST API server
- **Replit Authentication** with OpenID Connect for user management
- **WebSocket Server** for real-time bidirectional communication
- **Session-based authentication** with PostgreSQL session storage

### Data Storage
- **PostgreSQL** database with connection pooling via Neon serverless
- **Drizzle ORM** for type-safe database operations and schema management
- **Session storage** using connect-pg-simple for authentication persistence

## Key Components

### Authentication System
- Replit OAuth integration with OIDC
- Secure session management with PostgreSQL storage
- Protected routes with middleware authentication
- Automatic session refresh and user state synchronization

### Real-time Communication
- WebSocket server for instant message delivery
- Connection management with user presence tracking
- Typed message protocols for different event types
- Auto-reconnection and error handling

### Database Schema
- **Users**: Profile information, online status, and timestamps
- **Conversations**: Two-participant chat sessions with metadata
- **Messages**: Content, sender, timestamps, and read status
- **Sessions**: Authentication session storage (required for Replit Auth)

### UI Framework
- Shadcn/ui component library for consistent design
- Dark/light theme support with system preference detection
- Responsive design with mobile-first approach
- Toast notifications for user feedback

## Data Flow

1. **Authentication Flow**:
   - User initiates login through Replit OAuth
   - Server validates credentials and creates session
   - Client receives authentication state and user data
   - Subsequent requests include session cookies

2. **Real-time Messaging**:
   - Client establishes WebSocket connection after authentication
   - Messages sent through WebSocket are immediately broadcasted
   - Database persistence happens asynchronously
   - UI updates optimistically with server confirmation

3. **Conversation Management**:
   - Conversations created automatically when users first message
   - Messages loaded on-demand with pagination support
   - Read receipts and typing indicators tracked in real-time

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection with serverless compatibility
- **@radix-ui/react-***: Headless UI primitives for accessibility
- **@tanstack/react-query**: Server state management
- **drizzle-orm**: Type-safe database ORM
- **express**: Web application framework
- **ws**: WebSocket implementation

### Development Tools
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler for production
- **Vite**: Development server and build tool
- **Tailwind CSS**: Utility-first CSS framework

## Deployment Strategy

### Development Environment
- **Replit**: Cloud-based development with hot reloading
- **Vite dev server**: Frontend development with HMR
- **tsx**: TypeScript execution for backend development
- **PostgreSQL**: Database provisioned through Replit

### Production Build
- **Multi-stage build**: Client assets built first, then server bundle
- **Static asset serving**: Client files served from dist/public
- **Process management**: Single Node.js process serving both API and static files
- **Environment variables**: Database URL and session secrets configured

### Scaling Considerations
- Database connection pooling for concurrent users
- Session storage in PostgreSQL for horizontal scaling
- WebSocket connection management with user mapping
- Static asset optimization and caching headers

## Changelog

```
Changelog:
- June 18, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```