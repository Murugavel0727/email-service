# Email Agent Application

An AI-powered email assistant that helps you draft, compose, and send professional emails. Built with FastAPI (Backend) and React/Vite (Frontend).

## 🚀 Features

- **AI-Powered Drafting**: Uses Gemini API to help write professional emails.
- **Gmail Integration**: Send emails directly from the interface.
- **Clean UI**: Modern chat interface built with Tailwind CSS and Framer Motion.
- **Settings Management**: Configure API keys and backend settings from the UI.

## 📁 Project Structure

```text
├── backend/            # FastAPI backend
│   ├── main.py         # API entry point
│   ├── agent.py        # AI agent logic
│   └── ...
├── frontend/           # React frontend (Vite)
│   ├── src/            # Component source code
│   └── ...
└── .gitignore          # Root Git ignore rules
```

## 🛠️ Getting Started

### Prerequisites

- Python 3.10+
- Node.js (v18+)
- Gemini API Key

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file from the placeholder and add your `GEMINI_API_KEY`.
5. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup

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

## 📝 License

This project is for demonstration purposes.
