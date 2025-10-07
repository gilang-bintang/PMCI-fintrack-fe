# Spending Dashboard Backend

FastAPI backend for processing bank statement PDFs and providing transaction data.

## Setup

1. Install dependencies:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

2. Set up environment variables:
\`\`\`bash
cp .env.example .env
# Edit .env and add your OpenAI API key
\`\`\`

3. Run the server:
\`\`\`bash
python main.py
\`\`\`

The API will be available at http://localhost:8000

## API Endpoints

- `POST /upload` - Upload PDF bank statements
- `GET /transactions` - Get transactions with optional date filtering
- `GET /summary/daily` - Daily spending summary
- `GET /summary/weekly` - Weekly spending summary (Monday start)
- `GET /summary/monthly` - Monthly spending summary
- `GET /summary/category` - Category-based spending summary
- `GET /recurring` - Get recurring transactions

## Features

- OpenAI-powered PDF parsing with strict JSON schema
- Automatic transaction categorization
- Recurring transaction detection
- Jakarta timezone support
- Local JSON file storage
- CORS enabled for Next.js frontend
