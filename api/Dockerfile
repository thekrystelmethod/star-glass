FROM python:3.12-slim
WORKDIR /app
# pyswisseph compiles C (and one C++ file) at install time; the slim image
# ships no compilers, so provide both. gcc alone got 58 seconds into the
# build before swhdbxx.cpp asked for g++ — hence the pair.
RUN apt-get update && apt-get install -y --no-install-recommends gcc g++ libc6-dev \
    && rm -rf /var/lib/apt/lists/*
COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY scripts/ scripts/
COPY api/ api/
RUN python scripts/setup_ephemeris.py
EXPOSE 8000
# Cloud hosts (Render, Fly, Railway…) tell the container which port to use
# via the PORT environment variable; locally it falls back to 8000. The
# shell form is what lets ${PORT:-8000} expand.
CMD uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}
