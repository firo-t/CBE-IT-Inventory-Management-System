# CBE Inventory Management System — Frontend

Complete Next.js/React/TypeScript frontend foundation wired to the verified backend API contract.

## Stack
Next.js 15, React 19, TypeScript, Axios, React Hook Form/Zod-ready forms, Tailwind CSS, Lucide.

## Backend
Development API: `http://localhost:3001`

Create `.env.local` from `.env.example` if the backend URL changes:

`NEXT_PUBLIC_API_URL=http://localhost:3001`

## Run
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

## Important
The frontend does not access PostgreSQL. It uses the NestJS REST API and JWT Bearer authentication.

PDF/Excel report exports use `responseType: 'blob'`. Attachments should be sent with `FormData` and must follow the backend's 5MB/type rules.
