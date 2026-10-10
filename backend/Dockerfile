FROM python:3.10-slim

WORKDIR /app

# Install system dependencies needed for compiling certain packages (like asyncpg)
RUN apt-get update && apt-get install -y gcc postgresql-client libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose port
EXPOSE 8000

# Command to run (migrations will run on startup via a script or let docker-compose handle it)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
