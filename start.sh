#!/bin/bash
echo "⚕️  Starting Nexus Care..."
echo ""

# Check .env
if [ ! -f "backend/.env" ]; then
  echo "⚠️  No .env file found in backend/"
  echo "   Copy backend/.env.example to backend/.env and fill in your values"
  echo ""
fi

echo "Starting backend on port 5000..."
cd backend && npm run dev &
BACKEND_PID=$!

sleep 2

echo "Starting frontend on port 5173..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Nexus Care is running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:5000"
echo "   API Docs: http://localhost:5000/api/health"
echo ""
echo "Press Ctrl+C to stop all services"

wait $BACKEND_PID $FRONTEND_PID
