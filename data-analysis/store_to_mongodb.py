print("Script started!")
from pymongo import MongoClient
import json

def connect_to_mongodb():
    """Connect to MongoDB"""
    try:
        client = MongoClient('mongodb://localhost:27017/')
        db = client['review_analyzer']
        print("Connected to MongoDB")
        return db
    except Exception as e:
        print(f"Error connecting: {e}")
        return None


def load_reviews_to_mongodb(file_path, max_reviews=20000):
    """
    Load Yelp reviews from JSON file into MongoDB
    
    Args:
        file_path: Path to yelp review JSON file
        max_reviews: Number of reviews to load (default 20000)
    """
    
    db = connect_to_mongodb()
    if db is None:
        return
    
    # Get or create reviews collection
    reviews_collection = db['reviews']
    
    print(f"\nLoading {max_reviews} reviews from {file_path}...")
    print("This may take a few minutes...\n")
    
    reviews_loaded = 0
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            batch = []
            batch_size = 1000
            
            for i, line in enumerate(f):
                if i >= max_reviews:
                    break
                
                try:
                    review = json.loads(line)
                    batch.append(review)
                    
                    # Insert in batches for better performance
                    if len(batch) >= batch_size:
                        reviews_collection.insert_many(batch)
                        reviews_loaded += len(batch)
                        print(f"Loaded {reviews_loaded} reviews...")
                        batch = []
                        
                except json.JSONDecodeError as e:
                    print(f"Error parsing line {i}: {e}")
                    continue
            
            # Insert remaining reviews
            if batch:
                reviews_collection.insert_many(batch)
                reviews_loaded += len(batch)
                print(f"Loaded {reviews_loaded} reviews...")
        
        print(f"\n Successfully loaded {reviews_loaded} reviews into MongoDB!")
        
        # Show statistics
        total_count = reviews_collection.count_documents({})
        print(f"Total reviews in database: {total_count}")
        
        # Show sample review
        sample = reviews_collection.find_one()
        print("\nSample review from database:")
        print(f"Business ID: {sample.get('business_id')}")
        print(f"Stars: {sample.get('stars')}")
        print(f"Text: {sample.get('text')[:100]}...")
        
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    reviews_file = "data/yelp_academic_dataset_review.json"
    
    print("=" * 60)
    print("LOAD YELP REVIEWS INTO MONGODB")
    print("=" * 60 + "\n")
    
    # Load 20,000 reviews
    load_reviews_to_mongodb(reviews_file, max_reviews=20000)