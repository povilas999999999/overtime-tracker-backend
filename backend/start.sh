#!/bin/bash
set -e

echo "🚀 Starting FastAPI backend on Railway..."
echo "📍 Region: europe-west4"
echo "🔌 Port: ${PORT:-8001}"

# Check if MONGO_URL is set
if [ -z "$MONGO_URL" ]; then
    echo "⚠️  WARNING: MONGO_URL not set!"
    echo "Using default MongoDB URL (will fail if MongoDB not available)"
    export MONGO_URL="mongodb://localhost:27017"
fi

echo "🗄️  MongoDB URL: ${MONGO_URL:0:20}..."

# Check if PORT is set by Railway
if [ -z "$PORT" ]; then
    echo "⚠️  WARNING: PORT not set by Railway, using default 8001"
    export PORT=8001
fi

echo "🌐 Starting uvicorn on 0.0.0.0:$PORT"

# Start uvicorn
exec uvicorn server:app --host 0.0.0.0 --port $PORT --log-level info
