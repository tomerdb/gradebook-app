# Database Migration Guide

## Problem
SQLite database gets reset on every Render deployment/restart because the file system is ephemeral.

## Solution: Migrate to PostgreSQL

### Step 1: Add PostgreSQL to render.yaml
```yaml
services:
  - type: web
    name: grade-book-backend
    runtime: node
    plan: free
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        generateValue: true
      - key: DATABASE_URL
        fromDatabase:
          name: grade-book-db
          property: connectionString
    healthCheckPath: /api/health

databases:
  - name: grade-book-db
    databaseName: gradebook
    plan: free
```

### Step 2: Install PostgreSQL dependencies
```bash
cd backend
npm install pg
```

### Step 3: Update db.js to use PostgreSQL
Replace SQLite code with PostgreSQL connection using DATABASE_URL environment variable.

### Step 4: Update SQL syntax
Convert SQLite-specific syntax to PostgreSQL-compatible syntax.
