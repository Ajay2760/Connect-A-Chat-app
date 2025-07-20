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
- **Guest user system** without authentication requirements
- **WebSocket Server** for real-time bidirectional communication
- **No authentication dependencies** for simplified deployment

### Data Storage
- **In-memory storage** for simplified deployment without database dependencies
- **Guest user management** with automatic avatar generation
- **No external authentication services** required

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

## Essential Chat Features

### Core Messaging
- **Real-time messaging** with instant delivery via WebSocket
- **File and image sharing** with drag-and-drop upload support
- **Message reactions** with emoji responses and reaction counts
- **Message status indicators** showing sent/delivered/read states
- **Typing indicators** showing when users are composing messages
- **Message timestamps** with relative and absolute time display

### File Sharing & Media
- **Image preview** with full-size viewing and download options
- **File attachments** supporting documents, PDFs, and archives
- **File size limits** with automatic validation (10MB max)
- **Thumbnail generation** for image files
- **Download functionality** for all shared files

### Interactive Features
- **Message reactions** with popular emoji selection
- **Reaction aggregation** showing user counts per emoji
- **One-click emoji reactions** with toggle functionality
- **Real-time reaction updates** via WebSocket

### User Experience
- **Professional emoji picker** with categorized emoji selection
- **User search and discovery** to start new conversations
- **Online status tracking** with real-time presence indicators
- **Responsive design** optimized for desktop and mobile
- **Animated typing indicators** with visual feedback

### Authentication & Security
- **Guest user system** with name-based entry (no signup required)
- **Automatic avatar generation** based on user names
- **Simple session management** for easy deployment
- **Zero external dependencies** for authentication

### Interface Components
- **Clean sidebar** with conversation list and user profile
- **Message bubbles** with distinct styling for sent/received messages
- **File upload interface** with preview and progress indicators
- **Reaction UI** with hover effects and user feedback
- **Search functionality** for finding and starting conversations
- **Theme switching** between light and dark modes
- **Professional landing page** for guest user entry

## Changelog

```
Changelog:
- June 18, 2025. Initial setup and core architecture
- June 18, 2025. Added essential chat features:
  * User search dialog for starting conversations
  * Professional emoji picker with categories
  * Message status indicators
  * Real-time typing indicators
  * Online presence tracking
  * Removed landing page preview section
  * Enhanced message input with emoji support
- June 19, 2025. Deployment-ready improvements:
  * Switched from Replit Auth to Firebase authentication
  * Added Google and Facebook social login options
  * Replaced PostgreSQL with in-memory storage for easy deployment
  * Fixed deployment errors and removed database dependencies
  * Updated landing page with social media login buttons
- June 19, 2025. Guest user system implementation:
  * Removed all authentication requirements
  * Implemented simple name-based user entry
  * Added automatic avatar generation based on user names
  * Simplified server architecture without authentication middleware
  * Created deployment-ready application with zero dependencies
- June 19, 2025. Advanced chat features implementation:
  * File and image sharing with drag-and-drop upload support
  * Message reactions with emoji responses and real-time updates
  * Enhanced typing indicators with animated visual feedback
  * File preview system with download functionality
  * Support for multiple file formats (images, documents, PDFs)
  * File size validation and error handling
  * Reaction aggregation showing user counts per emoji
  * Complete in-memory storage support for all new features
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```