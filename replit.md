# Overview

This is a data lineage visualization application built with a full-stack TypeScript architecture. The application provides an interactive canvas for visualizing database table relationships, columns, and data flow connections in a modern web interface. It's designed for data engineers and analysts to understand and explore data pipelines and dependencies.

**Local Development Setup**: This project is configured for local development and can be run entirely within the Replit environment without external deployments.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React with TypeScript**: Modern component-based UI using functional components and hooks
- **Vite**: Fast development build tool with hot module replacement for optimal developer experience
- **Tailwind CSS**: Utility-first CSS framework for consistent styling
- **shadcn/ui**: Pre-built component library built on Radix UI primitives for accessible, customizable components
- **React Query**: Server state management for data fetching, caching, and synchronization
- **React Flow**: Specialized library for building interactive node-based diagrams and flowcharts
- **Wouter**: Lightweight client-side routing solution

## Backend Architecture
- **Express.js**: RESTful API server handling HTTP requests and responses
- **Node.js with ESM**: Modern JavaScript runtime using ES modules for better performance
- **TypeScript**: Type-safe server-side development with shared types between frontend and backend
- **In-Memory Storage**: Current implementation uses a memory-based storage layer with sample data
- **Middleware Pattern**: Custom logging and error handling middleware for request processing

## Data Storage Solutions
- **Drizzle ORM**: Type-safe database toolkit configured for PostgreSQL with schema-first approach
- **PostgreSQL**: Primary database configured via Drizzle for production data persistence
- **Shared Schema**: Common TypeScript types and Zod validation schemas used across client and server
- **Memory Storage Interface**: Abstracted storage layer allowing easy transition from in-memory to database storage

## Component Architecture
- **Modular Design**: Separate components for sidebar navigation, canvas controls, table nodes, and lineage visualization
- **Custom Hooks**: Reusable logic for mobile detection, toast notifications, and responsive behavior
- **UI Component Library**: Comprehensive set of accessible components including dialogs, forms, buttons, and data display elements

## Data Flow Architecture
- **RESTful APIs**: Clean endpoint structure for projects, tables, columns, and lineage connections
- **Type-Safe Communication**: Shared TypeScript interfaces ensure consistency between frontend and backend
- **React Query Integration**: Automatic caching, background updates, and error handling for API calls
- **Real-time Canvas**: Interactive visualization with drag-and-drop, zoom controls, and minimap navigation

# External Dependencies

## Database Integration
- **@neondatabase/serverless**: Serverless PostgreSQL driver for cloud database connectivity
- **Drizzle Kit**: Database migration and schema management tools

## UI and Visualization
- **React Flow**: Interactive diagram and flowchart rendering with node manipulation capabilities
- **Radix UI**: Comprehensive set of low-level UI primitives for building accessible components
- **Lucide React**: Modern icon library providing consistent iconography throughout the application
- **Embla Carousel**: Touch-friendly carousel component for content navigation

## Development Tools
- **Vite Plugins**: Development environment enhancements including error overlays and Replit integration
- **PostCSS**: CSS processing pipeline with Tailwind CSS integration
- **ESBuild**: Fast JavaScript bundler for production builds

## Utility Libraries
- **React Hook Form**: Efficient form handling with validation support
- **Date-fns**: Date manipulation and formatting utilities
- **Class Variance Authority**: Type-safe CSS class composition for component variants
- **CLSX**: Conditional className utility for dynamic styling

# Local Development Guide

## Running the Application
The application is configured to run automatically in Replit:
1. The "Start application" workflow runs `npm run dev`
2. Frontend served on port 5000 via Vite with hot reload
3. Backend Express server integrated with frontend
4. Live updates on file changes

## Key Features Implemented
- ✅ Interactive table nodes with expandable columns
- ✅ Scrollable and resizable column containers
- ✅ Interactive relationship lines between tables
- ✅ Column-level lineage visualization
- ✅ Drag-and-drop node positioning
- ✅ Zoom and pan controls
- ✅ Real-time data updates

## Current Data Source
- Using in-memory storage with sample data
- Can be configured for Snowflake integration via environment variables
- Database schema ready for PostgreSQL integration