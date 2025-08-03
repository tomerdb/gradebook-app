"# Grade Book Evaluation App

A comprehensive student evaluation management system built with Node.js/Express backend and AngularJS frontend.

## Features

### 🔐 Authentication & Authorization
- Role-based access control (Admin, Teacher, Student)
- JWT token authentication
- Secure login system

### 👨‍💼 Admin Features
- User management (Create, Edit, Delete users)
- System-wide statistics and reports
- Global evaluation oversight
- PDF and CSV report generation

### 👨‍🏫 Teacher Features
- Student evaluation creation
- View assigned students
- Generate class reports
- Track evaluation history

### 🧑‍🎓 Student Features
- View personal evaluations
- Download individual reports
- Performance tracking
- Subject-wise analysis

## Technology Stack

### Backend
- **Node.js** with Express.js
- **SQLite3** database
- **JWT** for authentication
- **bcrypt** for password hashing
- **PDFKit** for PDF generation
- **csv-writer** for CSV exports

### Frontend
- **AngularJS** (1.x)
- **Bootstrap 5** for UI
- **Font Awesome** for icons
- **Responsive design**

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm package manager

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the backend server:**
   ```bash
   npm start
   ```
   
   The backend will run on `http://localhost:3000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the frontend server:**
   ```bash
   npm start
   ```
   
   The frontend will run on `http://localhost:8080`

## Demo Accounts

The system comes with pre-configured demo accounts:

### Admin Account
- **Email:** admin@gradebook.com
- **Password:** admin123
- **Access:** Full system administration

### Teacher Account
- **Email:** teacher@gradebook.com
- **Password:** teacher123
- **Access:** Student evaluation and reporting

### Student Account
- **Email:** student@gradebook.com
- **Password:** student123
- **Access:** View personal evaluations and reports

## Usage

1. Start the backend server first (runs on port 3000)
2. Start the frontend server (runs on port 8080)
3. Open your browser to `http://localhost:8080`
4. Use the demo credentials to login and explore the system
5. Admin can create new users and manage the system
6. Teachers can evaluate students and generate reports
7. Students can view their evaluations and download reports

## Project Structure

```
grade-book-app/
├── backend/
│   ├── controllers/     # Business logic
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── middleware/     # Authentication middleware
│   └── app.js          # Main server file
└── frontend/
    ├── js/             # AngularJS application
    ├── views/          # HTML templates
    ├── css/            # Styling
    └── index.html      # Main HTML file
```

This is a minimal, functional grade book evaluation system that provides all the core features for managing student evaluations across different user roles." 
