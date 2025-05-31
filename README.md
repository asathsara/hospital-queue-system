# Hospital Queue System

A web-based hospital queue management system with real-time updates for patients, doctors, and admins.

## Features
- Patient registration and queue management
- Real-time updates for doctors and display screens
- Admin dashboard for CRUD operations
- Day/night theme toggle
- Responsive design (desktop & mobile)

## Project Structure
```
backend/         # Node.js/Express backend
frontend/
  admin/         # Admin React app (Vite)
  display/       # Public display HTML
  doctor/        # Doctor dashboard HTML
```

## Setup

### 1. Backend
```powershell
cd backend
npm install
node index.js
```

### 2. Frontend (Admin)
```powershell
cd frontend/admin
npm install
npm run dev
```

### 3. Display & Doctor
Open `frontend/display/display.html` and `frontend/doctor/doctor.html` in your browser (served via a static server or directly).

## Development
- Uses Tailwind CSS for styling (see `/public/tailwind.css`)
- Real-time communication via Socket.IO

## License
MIT
