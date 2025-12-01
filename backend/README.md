# Nexus Project - Backend

University project management system backend built with Node.js, Express, and MongoDB.

## Features

- User authentication with JWT and GitHub OAuth
- Project management with role-based access
- Kanban task board
- Evaluation system with weighted scoring
- GitHub commits sync
- PDF/CSV export
- Feedback threads
- Project archiving

## Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Create .env file with required variables

3. Start MongoDB

4. Run the server:
   \`\`\`bash
   npm run dev
   \`\`\`

## API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/profile

### Projects
- GET /api/projects
- POST /api/projects
- GET /api/projects/:id
- PUT /api/projects/:id
- DELETE /api/projects/:id

### Tasks
- GET /api/tasks/project/:projectId
- POST /api/tasks
- PUT /api/tasks/:id
- DELETE /api/tasks/:id

### Evaluations
- GET /api/evaluations/project/:projectId
- POST /api/evaluations
- PUT /api/evaluations/:id

### Feedback
- GET /api/feedback/project/:projectId
- POST /api/feedback
- POST /api/feedback/:id/reply

### Commits
- GET /api/commits/project/:projectId
- POST /api/commits

### Archive
- GET /api/archive
- POST /api/archive/:projectId
