# Product Review Analyzer

Multi-platform review analysis using NLP and Graph Analytics

## Project Goal
Identify fake and misleading product reviews across multiple platforms using Natural Language Processing and Graph-based analysis.

## Tech Stack
- **Backend:** Node.js, Express
- **Data Analysis:** Python, NLTK, scikit-learn, NetworkX
- **Database:** MongoDB (to be added)
- **Frontend:** HTML, CSS, JavaScript

## Current Setup

### What's Working:
Backend server running on port 3000
Python virtual environment configured
Web scraping tools installed and tested
Git version control initialized

### Installation Steps
1. Clone or download this repository
2. Install backend dependencies:
```bash
   cd backend
   npm install
```
3. Create Python virtual environment:
```bash
   python3 -m venv venv
   source venv/bin/activate  # Mac/Linux
```
4. Install Python dependencies:
```bash
   pip install -r requirements.txt
```

### Running the Project
1. Start backend server:
```bash
   cd backend
   npm run dev
```
   Server runs on: http://localhost:3000

2. Test backend:
   Visit: http://localhost:3000/api/test

3. Test Python scraper:
```bash
   python3 data-collection/test_scraper.py
```

## Project Status
- [x] Project setup complete
- [x] Backend server running
- [x] Python environment configured
- [x] Web scraping test successful
- [ ] Build actual platform scrapers
- [ ] Implement data storage (MongoDB)
- [ ] NLP text analysis
- [ ] Graph analytics for reviewer behavior
- [ ] Frontend interface
- [ ] Integration and testing

