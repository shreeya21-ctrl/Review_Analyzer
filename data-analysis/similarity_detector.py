print("Script started!")
from pymongo import MongoClient
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from text_preprocessing import preprocess_review

def connect_to_mongodb():
    """Connect to MongoDB"""
    client = MongoClient('mongodb://localhost:27017/')
    db = client['review_analyzer']
    return db

def find_similar_reviews(limit=1000, similarity_threshold=0.8):
    """
    Find similar reviews using TF-IDF and cosine similarity
    
    Args:
        limit: Number of reviews to analyze
        similarity_threshold: Minimum similarity score (0-1) to flag as duplicate
    
    Returns:
        List of similar review pairs
    """
    
    print(f"Analyzing {limit} reviews for similarity...")
    print(f"Similarity threshold: {similarity_threshold}\n")
    
    # Connect to database
    db = connect_to_mongodb()
    
    # Get reviews from database
    reviews = list(db['reviews'].find({}).limit(limit))
    
    if len(reviews) < 2:
        print("Not enough reviews to compare")
        return []
    
    print(f"Loaded {len(reviews)} reviews")
    
    # Extract review texts and IDs
    review_texts = []
    review_ids = []
    
    for review in reviews:
        text = review.get('text', '')
        if text:
            # Preprocess the text
            processed = preprocess_review(text)
            cleaned_text = processed['cleaned']
            review_texts.append(cleaned_text)
            review_ids.append(review.get('review_id'))
    
    print(f"Processing {len(review_texts)} valid reviews\n")
    
    # Create TF-IDF vectors
    print("Creating TF-IDF vectors...")
    vectorizer = TfidfVectorizer(max_features=500)
    tfidf_matrix = vectorizer.fit_transform(review_texts)
    
    # Calculate similarity between all review pairs
    print("Calculating similarities...")
    similarity_matrix = cosine_similarity(tfidf_matrix)
    
    # Find similar pairs
    similar_pairs = []
    
    for i in range(len(similarity_matrix)):
        for j in range(i + 1, len(similarity_matrix)):
            similarity_score = similarity_matrix[i][j]
            
            if similarity_score >= similarity_threshold:
                similar_pairs.append({
                    'review1_id': review_ids[i],
                    'review2_id': review_ids[j],
                    'similarity_score': round(float(similarity_score), 3),
                    'review1_text': review_texts[i][:100] + "...",
                    'review2_text': review_texts[j][:100] + "..."
                })
    
    print(f"\nFound {len(similar_pairs)} similar review pairs")
    return similar_pairs


def analyze_and_report(limit=1000):
    """Run similarity analysis and print report"""
    
    similar_pairs = find_similar_reviews(limit=limit, similarity_threshold=0.6)
    
    if not similar_pairs:
        print("\nNo highly similar reviews found")
        return
    
    print("\n" + "=" * 60)
    print("SIMILARITY ANALYSIS REPORT")
    print("=" * 60)
    
    print(f"\nTotal similar pairs found: {len(similar_pairs)}")
    print(f"Percentage of reviews involved: {(len(similar_pairs) * 2 / limit) * 100:.1f}%")
    
    # Show top 5 most similar pairs
    similar_pairs.sort(key=lambda x: x['similarity_score'], reverse=True)
    
    print("\nTop 5 most similar review pairs:\n")
    
    for idx, pair in enumerate(similar_pairs[:5], 1):
        print(f"{idx}. Similarity: {pair['similarity_score']}")
        print(f"   Review 1: {pair['review1_text']}")
        print(f"   Review 2: {pair['review2_text']}")
        print()
    
    # Save results to database
    db = connect_to_mongodb()
    
    # Clear old results
    db['similar_reviews'].delete_many({})
    
    # Insert new results
    if similar_pairs:
        db['similar_reviews'].insert_many(similar_pairs)
        print(f"Saved {len(similar_pairs)} similar pairs to database")


if __name__ == "__main__":
    print("=" * 60)
    print("REVIEW SIMILARITY DETECTOR")
    print("=" * 60 + "\n")
    
    # Analyze first 1000 reviews
    print("Testing threshold: 0.6 (60% similar)")
    analyze_and_report(limit=1000)