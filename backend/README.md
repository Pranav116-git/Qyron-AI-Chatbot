# AI Chatbot Backend

FastAPI backend for the AI Chatbot application.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Copy `.env.example` to `.env` and fill in your API key:
```bash
cp .env.example .env
```

4. Run the server:
```bash
uvicorn app.main:app --reload --port 8000
```

## Endpoints

- `GET /health` - Health check
- `POST /api/chat` - Send chat messages
