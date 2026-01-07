# Mango Online Store

A modern, API-first salon management and e-commerce platform built with React, TypeScript, and Vite. Designed for seamless integration with Mango Biz, AI Service, and other external modules.

## Project info

**URL**: https://lovable.dev/projects/ea19bffa-1354-45f2-8d03-0c290b883cfe

## Architecture Overview

Mango Online Store is a **clean, integration-ready application** with:

- **API-First Design**: All features exposed via REST APIs (`/api/v1/*`)
- **Service-Oriented**: Clear boundaries between services
- **Multi-Mode Support**: Standalone (MSW mocks) and Connected (real APIs)
- **Database-Agnostic**: Ready for SQL Server migration
- **Integration Contracts**: OpenAPI specs for all external services

### Integration Points

- **Mango Biz** - Core business data (services, products, staff, bookings)
- **AI Service** - Chat, recommendations, search (external API)
- **Stripe** - Payment processing
- **SendGrid/Postmark** - Transactional emails

### Development Modes

#### Standalone Mode (Default)
- Uses MSW (Mock Service Worker) for API mocking
- Data stored in localStorage
- Perfect for development and testing
- No external dependencies

#### Connected Mode
- Connects to real backend services
- Uses SQL Server database
- Integrates with Mango Biz and AI Service
- Production-ready

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/ea19bffa-1354-45f2-8d03-0c290b883cfe) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Radix UI** for components
- **MSW** for API mocking
- **PWA** capabilities

### Backend (API Layer)
- **Node.js 20+** with Express
- **SQL Server 2019+** (synced from Mango Biz)
- **Redis** (API response caching)
- **Cloudflare R2** (images, assets)

### External Services
- **Mango Biz API** - Core business data
- **AI Service API** - Chat, recommendations, search
- **Stripe API** - Payment processing
- **SendGrid/Postmark** - Transactional emails

## Key Features

- 🎨 **Dynamic Templates** - Customizable salon storefronts
- 🤖 **AI Assistant** - Intelligent chat for booking and support
- 📱 **Mobile-First** - Responsive design for all devices
- 🛍️ **E-commerce** - Products, services, memberships, gift cards
- 📅 **Booking System** - Service scheduling and management
- 🎯 **Marketing Tools** - Promotions and announcements
- 👥 **Admin Dashboard** - Complete salon management
- 🎨 **Theme Customization** - Brand personalization

## Local Development

The app runs completely locally with no external dependencies:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

**Environment Variables:**
```bash
# Required for AI chat functionality
VITE_LOVABLE_API_KEY=your_lovable_api_key
```

## Documentation

### Architecture & Integration
- **[PRD v5](docs/PRD_v5_Mango_Online_Store.md)** - Complete Product Requirements Document with clean architecture
- **[Architecture Overview](docs/architecture/README.md)** - System architecture and design principles
- **[Integration Guide](docs/integration/README.md)** - Integration instructions for Biz and AI teams
- **[Data Flow](docs/architecture/data-flow.md)** - Data ownership and integration flows

### API Documentation
- **[Store API](docs/api/store-api.openapi.yaml)** - Complete Store API specification
- **[AI Service Contract](docs/api/store-to-ai.openapi.yaml)** - AI Service integration contract
- **[Mango Biz Contract](docs/api/store-to-biz.openapi.yaml)** - Mango Biz integration contract

### Development
- **[Local API Documentation](docs/LOCAL_API.md)** - MSW mock API reference
- **[Template System](TEMPLATE_SYSTEM.md)** - Dynamic template architecture
- **[Marketing Settings API](docs/MARKETING_SETTINGS_API.md)** - Marketing configuration

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/ea19bffa-1354-45f2-8d03-0c290b883cfe) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
