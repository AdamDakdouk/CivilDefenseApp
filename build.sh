#!/bin/bash

# Build frontend
cd frontend
npm run build
cd ..

# Build backend
cd backend
npm run build
cd ..

echo "Build complete!"
