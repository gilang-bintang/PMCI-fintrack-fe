# Spending Dashboard

A local-only spending dashboard with AI-powered PDF processing for bank statements. Built with FastAPI backend and Next.js frontend.

## Features

- **AI PDF Processing**: Upload bank statement PDFs and extract transactions using OpenAI
- **Smart Categorization**: Automatic transaction categorization with keyword fallback
- **Recurring Detection**: Identify monthly and weekly recurring transactions
- **Interactive Dashboard**: Charts, KPIs, and detailed transaction analysis
- **Local Storage**: All data stored locally in JSON files
- **Responsive Design**: Mobile-first design that works on all devices
- **Export Functionality**: Export transaction data to CSV

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **OpenAI API**: PDF processing and transaction extraction
- **JSON Storage**: Simple file-based database
- **Python Libraries**: pytz for timezone handling

### Frontend
- **Next.js 15**: React framework with App Router
- **React Query**: Data fetching and caching
- **Recharts**: Interactive charts and visualizations
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Modern UI components

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 18+
- OpenAI API key

### Backend Setup

1. Navigate to the backend directory:
\`\`\`bash
cd backend
\`\`\`

2. Install Python dependencies:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env
# Edit .env and add your OpenAI API key:
# OPENAI_API_KEY=your_openai_api_key_here
\`\`\`

4. Run the FastAPI server:
\`\`\`bash
python main.py
\`\`\`

The backend will be available at http://localhost:8000

### Frontend Setup

1. Install Node.js dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the Next.js development server:
\`\`\`bash
npm run dev
\`\`\`

The frontend will be available at http://localhost:3000

## Usage

1. **Upload Bank Statements**: Go to the upload page and drag & drop PDF bank statements
2. **AI Processing**: The system will extract transactions using OpenAI's API
3. **View Dashboard**: Analyze your spending with interactive charts and KPIs
4. **Manage Transactions**: View all transactions, recurring payments, and export data

## API Endpoints

- \`POST /upload\` - Upload PDF bank statements
- \`GET /transactions\` - Get transactions with optional date filtering
- \`GET /summary/daily\` - Daily spending summary
- \`GET /summary/weekly\` - Weekly spending summary (Monday start)
- \`GET /summary/monthly\` - Monthly spending summary
- \`GET /summary/category\` - Category-based spending summary
- \`GET /recurring\` - Get recurring transactions

## Data Format

The system expects bank statement PDFs with the following column structure:
- **Date**: Transaction date
- **Description**: Transaction description
- **Amount**: Transaction amount (negative for outflows/spending)

## Categories

Transactions are automatically categorized into:
- Income
- Food & Dining
- Transport & Mobility
- Bills & Utilities
- Shopping & Entertainment

## Timezone

All dates and times are handled in Asia/Jakarta timezone with DD/MM/YYYY format.

## Local Storage

All data is stored locally in \`db.json\` with the following structure:
- \`users\`: User data (currently unused)
- \`transactions\`: All processed transactions
- \`imports\`: Import metadata and file information

## Error Handling

The system includes error handling for:
- Failed OpenAI API calls
- Invalid PDF formats
- Network connectivity issues
- Missing environment variables

## Security

- All processing happens locally
- No data is sent to external services except OpenAI for PDF processing
- OpenAI files are automatically managed and cleaned up
- CORS is configured for local development only

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for personal use and learning purposes.
\`\`\`
