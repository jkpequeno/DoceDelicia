# Overview

This is a Brazilian cupcake e-commerce application called "Doce Delícia" built with React on the frontend and Express.js on the backend. The application allows customers to browse cupcakes by category, add items to their cart, manage favorites, and place orders. It features authentication via Replit Auth, a responsive design using shadcn/ui components, and a PostgreSQL database for data persistence.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development/building
- **Routing**: Wouter for client-side routing with authentication-based route protection
- **State Management**: React Context API for cart state management combined with TanStack Query for server state
- **UI Components**: shadcn/ui component library with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom CSS variables for theming, featuring a pink/cupcake-themed color scheme
- **Forms**: React Hook Form with Zod validation for type-safe form handling

## Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful API with route-based organization serving JSON responses
- **Session Management**: Express sessions with PostgreSQL session store for persistence
- **Development Server**: Custom Vite integration for hot module replacement in development

## Data Storage
- **Primary Database**: PostgreSQL via Neon Database with connection pooling
- **Schema Management**: Drizzle migrations for database schema versioning
- **Session Storage**: PostgreSQL table for Express session persistence (required for Replit Auth)
- **Database Schema**: 
  - Users table (required for Replit Auth integration)
  - Products with categories, pricing, and inventory
  - Shopping cart items linked to authenticated users
  - Orders and order items for purchase history
  - Favorites system for user preferences

## Authentication & Authorization
- **Provider**: Replit Auth integration with OpenID Connect
- **Session Handling**: Express sessions with secure cookie configuration
- **Protected Routes**: Middleware-based route protection on backend
- **User Management**: Automatic user creation/updates via Replit Auth claims
- **Authorization Flow**: OAuth 2.0 with PKCE via Replit's identity provider

# External Dependencies

## Core Infrastructure
- **Database**: Neon Database (PostgreSQL) for primary data storage
- **Authentication**: Replit Auth service for user identity management
- **Hosting**: Designed for Replit deployment environment

## Development Tools
- **Replit Integrations**: Cartographer and dev banner plugins for Replit environment
- **Error Handling**: Runtime error overlay for development debugging
- **Build Tools**: ESBuild for server bundling, Vite for client bundling

## UI & Styling
- **Component Library**: Radix UI primitives for accessible components
- **Icons**: Lucide React for consistent iconography
- **Fonts**: Google Fonts integration (Architects Daughter, Source Code Pro)
- **Image Hosting**: Unsplash for product and hero images

## Data & API
- **Query Management**: TanStack Query for server state caching and synchronization
- **Validation**: Zod for runtime type validation and schema definition
- **Date Handling**: date-fns for date manipulation and formatting
- **Utilities**: clsx and tailwind-merge for conditional styling