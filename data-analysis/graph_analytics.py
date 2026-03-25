print("Script started!")
from pymongo import MongoClient
import networkx as nx
from collections import defaultdict, Counter
from datetime import datetime

def connect_to_mongodb():
    """Connect to MongoDB"""
    client = MongoClient('mongodb://localhost:27017/')
    db = client['review_analyzer']
    return db


def build_reviewer_network(limit=5000):
    """
    Build a network graph of reviewers and businesses
    
    Nodes: Reviewers and Businesses
    Edges: Reviews (connect reviewer to business)
    
    Args:
        limit: Number of reviews to analyze
    
    Returns:
        NetworkX graph object
    """
    
    print(f"Building reviewer network from {limit} reviews...")
    
    db = connect_to_mongodb()
    reviews = list(db['reviews'].find({}).limit(limit))
    
    # Create graph
    G = nx.Graph()
    
    # Add nodes and edges
    for review in reviews:
        user_id = review.get('user_id')
        business_id = review.get('business_id')
        
        if user_id and business_id:
            # Add nodes
            G.add_node(user_id, node_type='reviewer')
            G.add_node(business_id, node_type='business')
            
            # Add edge (review connection)
            G.add_edge(user_id, business_id, 
                      stars=review.get('stars'),
                      date=review.get('date'))
    
    print(f"Network created:")
    print(f"  Total nodes: {G.number_of_nodes()}")
    print(f"  Total edges (reviews): {G.number_of_edges()}")
    
    return G


def detect_suspicious_patterns(limit=5000):
    """
    Detect suspicious reviewer patterns
    
    Looks for:
    1. Users who reviewed same business multiple times
    2. Burst activity (many reviews in short time)
    3. Users only giving 5-star or 1-star reviews
    """
    
    print("\nAnalyzing reviewer patterns...")
    
    db = connect_to_mongodb()
    reviews = list(db['reviews'].find({}).limit(limit))
    
    # Track patterns
    user_businesses = defaultdict(list)
    user_ratings = defaultdict(list)
    user_dates = defaultdict(list)
    
    for review in reviews:
        user_id = review.get('user_id')
        business_id = review.get('business_id')
        stars = review.get('stars')
        date = review.get('date')
        
        if user_id:
            user_businesses[user_id].append(business_id)
            user_ratings[user_id].append(stars)
            if date:
                user_dates[user_id].append(date)
    
    suspicious_users = []
    
    # Pattern 1: Multiple reviews of same business
    for user_id, businesses in user_businesses.items():
        business_counts = Counter(businesses)
        duplicates = {biz: count for biz, count in business_counts.items() if count > 1}
        
        if duplicates:
            suspicious_users.append({
                'user_id': user_id,
                'pattern': 'multiple_reviews_same_business',
                'details': f"Reviewed {len(duplicates)} businesses multiple times"
            })
    
    # Pattern 2: Only extreme ratings
    for user_id, ratings in user_ratings.items():
        if len(ratings) >= 5:
            unique_ratings = set(ratings)
            # Only 5-star or only 1-star reviews
            if unique_ratings == {5.0} or unique_ratings == {1.0}:
                suspicious_users.append({
                    'user_id': user_id,
                    'pattern': 'extreme_ratings_only',
                    'details': f"All {len(ratings)} reviews are {list(unique_ratings)[0]}-star"
                })
    
    # Pattern 3: Burst activity (placeholder - would need date parsing)
    
    return suspicious_users


def calculate_credibility_scores(limit=1000):
    """
    Calculate basic credibility score for reviews
    
    Score factors:
    - Text similarity to other reviews (lower is better)
    - Rating extremity
    - Reviewer pattern flags
    """
    
    print("\nCalculating credibility scores...")
    
    db = connect_to_mongodb()
    
    # Get reviews and similar pairs
    reviews = list(db['reviews'].find({}).limit(limit))
    similar_pairs = list(db['similar_reviews'].find({}))
    
    # Create set of suspicious review IDs
    suspicious_review_ids = set()
    for pair in similar_pairs:
        if pair.get('similarity_score', 0) > 0.7:
            suspicious_review_ids.add(pair.get('review1_id'))
            suspicious_review_ids.add(pair.get('review2_id'))
    
    # Calculate scores
    scored_reviews = []
    
    for review in reviews:
        review_id = review.get('review_id')
        stars = review.get('stars', 3)
        
        # Base score
        score = 100
        
        # Penalty for high similarity
        if review_id in suspicious_review_ids:
            score -= 30
        
        # Penalty for extreme ratings
        if stars == 5.0 or stars == 1.0:
            score -= 10
        
        # Bonus for moderate ratings
        if stars in [3.0, 4.0]:
            score += 5
        
        # Ensure score is 0-100
        score = max(0, min(100, score))
        
        scored_reviews.append({
            'review_id': review_id,
            'credibility_score': score,
            'flags': []
        })
        
        if review_id in suspicious_review_ids:
            scored_reviews[-1]['flags'].append('high_similarity')
        if stars in [1.0, 5.0]:
            scored_reviews[-1]['flags'].append('extreme_rating')
    
    # Save to database
    db['review_scores'].delete_many({})
    if scored_reviews:
        db['review_scores'].insert_many(scored_reviews)
    
    # Statistics
    avg_score = sum(r['credibility_score'] for r in scored_reviews) / len(scored_reviews)
    flagged_count = sum(1 for r in scored_reviews if r['flags'])
    
    print(f"Scored {len(scored_reviews)} reviews")
    print(f"Average credibility: {avg_score:.1f}/100")
    print(f"Flagged as suspicious: {flagged_count} ({flagged_count/len(scored_reviews)*100:.1f}%)")
    
    return scored_reviews


def generate_report():
    """Generate comprehensive analysis report"""
    
    print("\n" + "=" * 60)
    print("FAKE REVIEW DETECTION REPORT")
    print("=" * 60)
    
    # Build network
    graph = build_reviewer_network(limit=5000)
    
    # Detect patterns
    suspicious = detect_suspicious_patterns(limit=5000)
    
    print(f"\nSuspicious reviewer patterns found: {len(suspicious)}")
    
    if suspicious:
        print("\nTop suspicious patterns:")
        for i, pattern in enumerate(suspicious[:5], 1):
            print(f"{i}. User: {pattern['user_id'][:20]}...")
            print(f"   Pattern: {pattern['pattern']}")
            print(f"   Details: {pattern['details']}\n")
    
    # Calculate credibility
    scores = calculate_credibility_scores(limit=1000)
    
    print("\n" + "=" * 60)
    print("ANALYSIS COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    print("=" * 60)
    print("GRAPH ANALYTICS & PATTERN DETECTION")
    print("=" * 60 + "\n")
    
    generate_report()