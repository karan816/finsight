#!/bin/bash
# ========================================================
# FinSight One-Click Launcher
# Starts both Backend and Frontend seamlessly
# ========================================================

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "🚀 Starting FinSight Application..."

# 1. Kill any existing process running on port 8000 or 5173
echo "🧹 Cleaning up existing server ports..."
lsof -ti :8000 | xargs kill -9 2>/dev/null
lsof -ti :5173 | xargs kill -9 2>/dev/null

# 2. Start the Backend API in the background
echo "🐍 Starting Python Backend on http://localhost:8000..."
python3 backend/main.py > /tmp/finsight_backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for Backend to initialize..."
for i in {1..15}; do
  if curl -s http://localhost:8000/api/analyze?ticker=AAPL\&start=2024-07-25\&end=2024-08-01 > /dev/null 2>&1; then
    echo "✅ Backend is UP and running!"
    break
  fi
  sleep 1
done

# 3. Start Frontend and open browser
echo "⚛️ Starting Frontend on http://localhost:5173..."
(
  cd frontend
  npm run dev
) &
FRONTEND_PID=$!

sleep 2
open http://localhost:5173 2>/dev/null || true

# Function to stop both when CTRL+C is pressed
cleanup() {
  echo ""
  echo "🛑 Shutting down FinSight servers..."
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  lsof -ti :8000 | xargs kill -9 2>/dev/null
  lsof -ti :5173 | xargs kill -9 2>/dev/null
  echo "Done."
  exit 0
}

trap cleanup INT TERM

echo ""
echo "🎉 FinSight is running at http://localhost:5173"
echo "Press [Ctrl + C] in this window to stop both servers."
wait
