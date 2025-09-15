# PocPortal (NextJS) Developer Setup Guide

## Table of Contents
1. [Initial Setup](#initial-setup)
2. [Development Workflow](#development-workflow)
3. [Git Workflow](#git-workflow)

## Initial Setup

1. Clone the repository:
```bash
git clone https://github.com/dkuhn-vm/ET-PocPortal.git
cd ET-PocPortal
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment:
- Get a copy of `.env.local`.
- Ensure it is stored in root.

## Development Workflow

### Starting the Development Server

1. Regular start (default port 3000):
```bash
npm run dev
```

2. Start on a specific port:
```bash
PORT=3001 npm run dev
```

### After Pulling Changes

Install new dependencies:
```bash
npm install
```

### Building for Production

Before pushing changes, always test the production build:

```bash
npm run build
```

If the build succeeds, test it locally:
```bash
npm run start
```

## Git Workflow

### Pulling Latest Changes

1. Pull latest changes to your dev/name branch before a new project
```bash
git fetch --all && git pull -r origin main
```

2. Commit your changes when ready [Note: Ensure you don't add/commit files that were changes unintentionally]
```bash
git add .
git commit -m "<message>"
```

3. Verify branch is synchronous with main
```bash
git fetch --all && git pull -r origin main
```