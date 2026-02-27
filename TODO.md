# TODO List - Product Review Analyzer

## Completed (Week 1 - Session 1)
- [x] Created project structure
- [x] Installed Node.js and npm
- [x] Set up backend server (Express)
- [x] Configured Python virtual environment
- [x] Installed Python packages (requests, beautifulsoup4, etc.)
- [x] Created and tested scraper setup
- [x] Initialized Git repository
- [x] Made first commit
- [x] Backend test route working on port 3000
- [x] Updated project documentation (README.md, TODO.md)

---

## Completed (Week 1 - Session 2)
- [x] Attempted Amazon scraping (learned about anti-bot protections)
- [x] Attempted Yelp scraping (learned about 403 blocks)
- [x] Researched Yelp Fusion API
- [x] Found official Yelp dataset (7M reviews)
- [x] Started downloading Yelp academic dataset
- [x] Created data loading script for Yelp dataset

---

## In Progress (Current Session)
- [ ] Extract Yelp dataset files
- [ ] Load 20,000 sample reviews
- [ ] Explore dataset structure

---

## Week 2-3: Data Preparation
- [ ] Load Yelp dataset into MongoDB
- [ ] Create database schema for reviews
- [ ] Create database schema for businesses
- [ ] Create database schema for users
- [ ] Build API endpoints to query reviews
- [ ] Test data retrieval

---

## Week 4-5: NLP Analysis
- [ ] Text preprocessing functions (tokenization, cleaning)
- [ ] Implement TF-IDF for text similarity
- [ ] Build sentiment analysis module
- [ ] Detect repetitive patterns and templates
- [ ] Identify duplicate/near-duplicate reviews

---

## Week 6-7: Graph Analytics
- [ ] Build reviewer-business network graph
- [ ] Implement burst detection (many reviews in short time)
- [ ] Detect reviewer clusters (coordinated groups)
- [ ] Calculate reviewer credibility scores
- [ ] Identify suspicious review patterns

---

## Week 8-9: Credibility Scoring System
- [ ] Combine NLP and graph metrics
- [ ] Create weighted scoring algorithm
- [ ] Classify reviews (trustworthy/suspicious/fake)
- [ ] Generate business credibility scores
- [ ] Validate results against known patterns

---

## Week 10-11: Frontend Development
- [ ] Design UI mockups
- [ ] Build search interface for businesses
- [ ] Create review analysis dashboard
- [ ] Add data visualizations (graphs, charts)
- [ ] Display credibility scores and flags
- [ ] Show reviewer network visualizations

---

## Week 12-13: Integration & Testing
- [ ] Connect frontend to backend APIs
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Bug fixes
- [ ] Code documentation

---

## Week 14-15: Final Polish
- [ ] Prepare demonstration with real examples
- [ ] Create presentation slides
- [ ] Write final project report
- [ ] Record demo video (optional)
- [ ] Final code cleanup

---

## Ideas / Notes
- Using official Yelp dataset (legal, reliable, 7M reviews)
- Focus on analysis rather than scraping (smart approach)
- Sample of 20K reviews sufficient for development
- Could add review export feature
- Learned: Modern websites have strong anti-scraping protections
- Dataset approach is industry standard for research projects

---


- **Port 3000** for backend (port 5000 was blocked)
- **Yelp dataset** instead of live scraping (anti-bot issues)
- **20K review sample** for development (scalable to full dataset)
- **MongoDB** for data storage (flexible schema for reviews)