# Deployment Guide

## Overview
This Vite React application is configured for deployment to Azure Web Apps with proper GitHub Actions CI/CD pipeline.

## Key Changes Made

### 1. Removed `dist` folder from repository
- The `dist` folder is now properly ignored in `.gitignore`
- Build artifacts are generated during CI/CD pipeline, not committed to source control

### 2. Updated GitHub Actions Workflow
- **Build step**: Now uploads only the `dist` folder as deployment artifact
- **Deploy step**: Deploys the built static assets to Azure Web Apps
- **Path**: `.github/workflows/main_pdf-intelligent-scanner.yml`

### 3. Optimized Vite Configuration
- Added production build optimizations
- Configured chunk splitting for better caching
- Set up proper asset handling for Azure deployment

### 4. Cleaned up Package.json
- Removed conflicting GitHub Pages deployment scripts
- Removed unused `gh-pages` dependency
- Streamlined build scripts

## Deployment Process

### Automatic Deployment
1. Push code to `main` branch
2. GitHub Actions automatically:
   - Installs dependencies
   - Builds the application (`npm run build`)
   - Uploads `dist` folder as artifact
   - Deploys to Azure Web App

### Manual Deployment
```bash
# Build the application
npm run build

# The dist folder contains all files needed for deployment
```

## File Structure After Build
```
dist/
├── index.html          # Main HTML file
├── assets/             # Bundled JS/CSS files
│   ├── index-*.js      # Main application bundle
│   ├── vendor-*.js     # React/vendor libraries
│   ├── ui-*.js         # UI components bundle
│   └── index-*.css     # Compiled styles
├── web.config          # Azure Web Apps configuration
├── robots.txt          # SEO configuration
├── favicon.ico.jpg     # Favicon
├── placeholder.svg     # Placeholder image
└── uploads/            # User uploaded files
```

## Azure Web Apps Configuration
- The `web.config` file handles SPA routing
- Static files are served correctly
- MIME types are configured for JSON and web manifest files

## Environment Variables
Make sure to configure these in Azure Web Apps:
- Any API endpoints
- Environment-specific configurations

## Troubleshooting
- If deployment fails, check the GitHub Actions logs
- Ensure all environment variables are set in Azure
- Verify the `web.config` file is present in the build output