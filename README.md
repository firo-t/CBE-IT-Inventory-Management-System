# CBE IT Hardware Inventory Management System

This is a centralized web-based application built to track the entire hardware asset workflow for CBE, from initial receipt and technical inspection, to branch assignment, maintenance loops, and eventual retirement.

## Architecture

This project is built using a three-tier architecture:
- **Frontend**: Next.js (located in `/frontend`)
- **Backend API**: NestJS (located in `/backend`)
- **Database**: PostgreSQL (provided via Docker Compose)

## Getting Started

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose (for PostgreSQL database)

### Setup

1. Start the PostgreSQL database:
   ```bash
   docker-compose up -d
   ```

2. Start the Backend API:
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

3. Start the Frontend Application:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Please refer to the `CBE Inventory Management System SRS.docx` and `CBE_SRS_Summary.docx` for complete project specifications.
