FROM python:3.12-slim
WORKDIR /app
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
