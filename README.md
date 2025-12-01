# Nexus Project - University Project Management System

A comprehensive full-stack web application for managing university student projects with advanced features including project management, Kanban boards, GitHub integration, evaluation grids, and feedback modules.

## Architecture

\`\`\`
nexus-project/
├── backend/              # Node.js/Express API
│   ├── src/
│   │   ├── models/      # MongoDB schemas
│   │   ├── routes/      # API endpoints
│   │   ├── middleware/  # Auth & utilities
│   │   ├── services/    # Business logic
│   │   └── index.js     # Entry point
│   ├── package.json
│   └── Dockerfile
├── frontend/            # Next.js application
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── .github/workflows/   # CI/CD
\`\`\`

## Quick Start

### Using Docker

\`\`\`bash
docker-compose up
\`\`\`

This starts:
- MongoDB on port 27017
- Backend API on port 5000
- Frontend on port 3000

### Manual Setup

1. **Backend**
   \`\`\`bash
   cd backend
   npm install
   npm run dev
   \`\`\`

2. **Frontend**
   \`\`\`bash
   cd frontend
   npm install
   npm run dev
   \`\`\`

## Features

- **User Management**: Role-based access control (student, instructor, admin)
- **Project Management**: Create, update, and manage projects
- **Kanban Board**: Visual task management with drag-and-drop
- **Evaluations**: Weighted scoring system with criteria
- **GitHub Integration**: Sync commits and repository stats
- **Feedback System**: Threaded comments and suggestions
- **Export**: Generate PDF and CSV reports
- **Project Archiving**: Archive completed projects
- **Authentication**: JWT + GitHub OAuth2

## Environment Variables

See `.env.example` for all required variables.

## API Documentation

See `backend/README.md` for detailed API endpoints.

## Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS, Zustand
- **Backend**: Node.js, Express, MongoDB, JWT
- **DevOps**: Docker, Docker Compose
- **CI/CD**: GitHub Actions

## License

MIT
