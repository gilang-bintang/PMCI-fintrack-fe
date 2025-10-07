from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import json
import tempfile
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import pytz
from openai import OpenAI
import re

app = FastAPI(title="Spending Dashboard API", version="1.0.0")

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Jakarta timezone
JAKARTA_TZ = pytz.timezone("Asia/Jakarta")

# Database file path
DB_FILE = "db.json"

# Initialize database
def init_db():
    if not os.path.exists(DB_FILE):
        with open(DB_FILE, 'w') as f:
            json.dump({
                "users": [],
                "transactions": [],
                "imports": []
            }, f, indent=2)

init_db()

def load_db():
    with open(DB_FILE, 'r') as f:
        return json.load(f)

def save_db(data):
    with open(DB_FILE, 'w') as f:
        json.dump(data, f, indent=2)

# Category fallback mapping for low confidence transactions
CATEGORY_KEYWORDS = {
    "Food & Dining": ["restaurant", "cafe", "food", "dining", "pizza", "burger", "coffee", "starbucks", "mcdonald", "kfc"],
    "Transport & Mobility": ["uber", "grab", "taxi", "fuel", "gas", "parking", "toll", "transport", "bus", "train"],
    "Bills & Utilities": ["electric", "water", "internet", "phone", "utility", "bill", "subscription", "netflix", "spotify"],
    "Shopping & Entertainment": ["amazon", "shop", "store", "mall", "cinema", "movie", "game", "entertainment", "retail"],
    "Income": ["salary", "wage", "income", "deposit", "transfer", "payment", "refund"]
}

def improve_category_with_keywords(description: str, current_category: str, confidence: float) -> str:
    """Improve category using keyword matching if confidence is low"""
    if confidence >= 0.6:
        return current_category
    
    description_lower = description.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(keyword in description_lower for keyword in keywords):
            return category
    
    return current_category

def detect_recurring_transactions(transactions: List[Dict]) -> List[Dict]:
    """Detect recurring transactions by grouping on merchant_canonical + amount"""
    # Group transactions by merchant and amount
    groups = {}
    for tx in transactions:
        key = f"{tx['merchant_canonical']}_{abs(tx['amount'])}"
        if key not in groups:
            groups[key] = []
        groups[key].append(tx)
    
    # Check for recurring patterns
    for group in groups.values():
        if len(group) >= 3:
            # Sort by date
            group.sort(key=lambda x: x['date'])
            dates = [datetime.strptime(tx['date'], '%Y-%m-%d') for tx in group]
            
            # Check for monthly pattern (27-33 days)
            monthly_gaps = []
            for i in range(1, len(dates)):
                gap = (dates[i] - dates[i-1]).days
                monthly_gaps.append(gap)
            
            is_monthly = all(27 <= gap <= 33 for gap in monthly_gaps)
            
            # Check for weekly pattern (6-8 days)
            weekly_gaps = []
            for i in range(1, len(dates)):
                gap = (dates[i] - dates[i-1]).days
                weekly_gaps.append(gap)
            
            is_weekly = all(6 <= gap <= 8 for gap in weekly_gaps)
            
            if is_monthly or is_weekly:
                for tx in group:
                    tx['recurring'] = True
    
    return transactions

@app.post("/upload")
async def upload_pdfs(files: List[UploadFile] = File(...)):
    """Upload and process PDF bank statements"""
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    import_id = str(uuid.uuid4())
    parsed_count = 0
    all_transactions = []
    
    db = load_db()
    
    for file in files:
        if not file.filename.endswith('.pdf'):
            continue
            
        # Save file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Upload to OpenAI Files API
            with open(temp_file_path, 'rb') as f:
                openai_file = client.files.create(file=f, purpose='assistants')
            
            # Define strict JSON schema for transaction extraction
            schema = {
                "type": "object",
                "properties": {
                    "transactions": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "date": {"type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$"},
                                "description": {"type": "string"},
                                "amount": {"type": "number"},
                                "merchant_canonical": {"type": "string"},
                                "category": {
                                    "type": "string",
                                    "enum": ["Income", "Food & Dining", "Transport & Mobility", "Bills & Utilities", "Shopping & Entertainment"]
                                },
                                "confidence": {"type": "number", "minimum": 0, "maximum": 1}
                            },
                            "required": ["date", "description", "amount", "merchant_canonical", "category", "confidence"],
                            "additionalProperties": false
                        }
                    }
                },
                "required": ["transactions"],
                "additionalProperties": false
            }
            
            # Call OpenAI with strict JSON schema
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "Extract transactions from the bank statement PDF. Parse each row with date, description, and amount (negative for outflows/spending). Categorize each transaction and provide a confidence score. Extract merchant name for merchant_canonical field."
                    },
                    {
                        "role": "user",
                        "content": f"Please extract all transactions from this bank statement: {openai_file.id}"
                    }
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "transaction_extraction",
                        "strict": True,
                        "schema": schema
                    }
                }
            )
            
            # Parse response
            result = json.loads(response.choices[0].message.content)
            transactions = result.get("transactions", [])
            
            # Improve categories with keyword fallback
            for tx in transactions:
                tx['category'] = improve_category_with_keywords(
                    tx['description'], 
                    tx['category'], 
                    tx['confidence']
                )
                tx['recurring'] = False  # Will be updated by recurring detection
            
            all_transactions.extend(transactions)
            parsed_count += len(transactions)
            
            # Store import metadata
            db["imports"].append({
                "import_id": import_id,
                "filename": file.filename,
                "openai_file_id": openai_file.id,
                "transaction_count": len(transactions),
                "created_at": datetime.now(JAKARTA_TZ).isoformat()
            })
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to process {file.filename}: {str(e)}")
        finally:
            # Clean up temp file
            os.unlink(temp_file_path)
    
    # Detect recurring transactions
    all_transactions = detect_recurring_transactions(all_transactions)
    
    # Add transactions to database
    for tx in all_transactions:
        tx['id'] = str(uuid.uuid4())
        tx['import_id'] = import_id
        db["transactions"].append(tx)
    
    save_db(db)
    
    return {"import_id": import_id, "parsed_count": parsed_count}

@app.get("/transactions")
async def get_transactions(
    start: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """Get transactions within date range"""
    db = load_db()
    transactions = db["transactions"]
    
    if start:
        transactions = [tx for tx in transactions if tx["date"] >= start]
    if end:
        transactions = [tx for tx in transactions if tx["date"] <= end]
    
    return {"transactions": transactions}

@app.get("/summary/daily")
async def get_daily_summary():
    """Get daily summary for the current month"""
    db = load_db()
    transactions = db["transactions"]
    
    now = datetime.now(JAKARTA_TZ)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    daily_summary = {}
    
    for tx in transactions:
        tx_date = datetime.strptime(tx["date"], "%Y-%m-%d")
        if tx_date >= start_of_month.replace(tzinfo=None):
            date_key = tx["date"]
            if date_key not in daily_summary:
                daily_summary[date_key] = {"income": 0, "spend": 0, "net": 0}
            
            if tx["amount"] > 0:
                daily_summary[date_key]["income"] += tx["amount"]
            else:
                daily_summary[date_key]["spend"] += abs(tx["amount"])
            
            daily_summary[date_key]["net"] = daily_summary[date_key]["income"] - daily_summary[date_key]["spend"]
    
    return {"summary": daily_summary}

@app.get("/summary/weekly")
async def get_weekly_summary():
    """Get weekly summary (Monday start)"""
    db = load_db()
    transactions = db["transactions"]
    
    weekly_summary = {}
    
    for tx in transactions:
        tx_date = datetime.strptime(tx["date"], "%Y-%m-%d")
        # Get ISO week (Monday start)
        year, week, _ = tx_date.isocalendar()
        week_key = f"{year}-W{week:02d}"
        
        if week_key not in weekly_summary:
            weekly_summary[week_key] = {"income": 0, "spend": 0, "net": 0}
        
        if tx["amount"] > 0:
            weekly_summary[week_key]["income"] += tx["amount"]
        else:
            weekly_summary[week_key]["spend"] += abs(tx["amount"])
        
        weekly_summary[week_key]["net"] = weekly_summary[week_key]["income"] - weekly_summary[week_key]["spend"]
    
    return {"summary": weekly_summary}

@app.get("/summary/monthly")
async def get_monthly_summary():
    """Get monthly summary"""
    db = load_db()
    transactions = db["transactions"]
    
    monthly_summary = {}
    
    for tx in transactions:
        tx_date = datetime.strptime(tx["date"], "%Y-%m-%d")
        month_key = tx_date.strftime("%Y-%m")
        
        if month_key not in monthly_summary:
            monthly_summary[month_key] = {"income": 0, "spend": 0, "net": 0}
        
        if tx["amount"] > 0:
            monthly_summary[month_key]["income"] += tx["amount"]
        else:
            monthly_summary[month_key]["spend"] += abs(tx["amount"])
        
        monthly_summary[month_key]["net"] = monthly_summary[month_key]["income"] - monthly_summary[month_key]["spend"]
    
    return {"summary": monthly_summary}

@app.get("/summary/category")
async def get_category_summary():
    """Get spending summary by category"""
    db = load_db()
    transactions = db["transactions"]
    
    category_summary = {}
    
    for tx in transactions:
        category = tx["category"]
        if category not in category_summary:
            category_summary[category] = {"income": 0, "spend": 0, "count": 0}
        
        if tx["amount"] > 0:
            category_summary[category]["income"] += tx["amount"]
        else:
            category_summary[category]["spend"] += abs(tx["amount"])
        
        category_summary[category]["count"] += 1
    
    return {"summary": category_summary}

@app.get("/recurring")
async def get_recurring_transactions():
    """Get all recurring transactions"""
    db = load_db()
    recurring = [tx for tx in db["transactions"] if tx.get("recurring", False)]
    
    return {"transactions": recurring}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
