# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code from backend directory
COPY backend/ .

# Expose port (informational only)
EXPOSE 8001

# Railway will use startCommand from railway.json
# This CMD is a fallback for local testing
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]