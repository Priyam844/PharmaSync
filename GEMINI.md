# Local Pharmacy Inventory Management System

This project is a localized inventory management system designed for pharmacies.

## Project Overview
- **Goal:** Provide a robust, easy-to-use system for managing medicine stock, sales, and suppliers.
- **Target Users:** Local pharmacists and staff.

## Technology Stack
- **Backend:** Django, Django REST Framework, PostgreSQL
- **Frontend:** React (TypeScript), Vite, Tailwind CSS

## Installation & Setup

### Backend
1. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
2. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Database Setup:
   - Ensure PostgreSQL is running.
   - Run the creation script to create the database:
     ```bash
     python create_db.py
     ```
   - Run migrations:
     ```bash
     python manage.py migrate
     ```
   - (Optional) Seed sample data:
     ```bash
     python seed_data.py
     ```
5. Run the server:
   ```bash
   python manage.py runserver
   ```

### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Development Conventions
- **Code Style:** Follow idiomatic patterns for the chosen language/framework.
- **Testing:** All features and bug fixes must include automated tests.
- **Documentation:** Keep the `GEMINI.md` and inline comments updated.

## Workflow Instructions
- **Research first:** Always map the codebase and validate assumptions before implementing.
- **Surgical edits:** Use `replace` for targeted changes in large files.
- **Validation:** Run linting, type-checking, and tests before finalizing any task.
