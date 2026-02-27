print("Script started")
import json
import os

def load_yelp_reviews(file_path, max_reviews=1000):
    
    reviews = []
    
    print(f"Loading reviews from {file_path}...")
    print(f"Loading first {max_reviews} reviews\n")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f):
                if i >= max_reviews:
                    break
                
                try:
                    review = json.loads(line)
                    reviews.append(review)
                    
                    if (i + 1) % 100 == 0:
                        print(f"Loaded {i + 1} reviews...")
                        
                except json.JSONDecodeError as e:
                    print(f"Error parsing line {i}: {e}")
                    continue
        
        print(f"\nSuccessfully loaded {len(reviews)} reviews")
        return reviews
        
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}")
        return []
    except Exception as e:
        print(f"Error loading file: {e}")
        return []


def analyze_sample_review(review):
    """Print details of a sample review"""
    print("\n" + "=" * 60)
    print("SAMPLE REVIEW:")
    print("=" * 60)
    print(f"Review ID: {review.get('review_id', 'N/A')}")
    print(f"User ID: {review.get('user_id', 'N/A')}")
    print(f"Business ID: {review.get('business_id', 'N/A')}")
    print(f"Stars: {review.get('stars', 'N/A')}")
    print(f"Date: {review.get('date', 'N/A')}")
    print(f"Useful: {review.get('useful', 0)}")
    print(f"Funny: {review.get('funny', 0)}")
    print(f"Cool: {review.get('cool', 0)}")
    print(f"\nReview Text:")
    print(review.get('text', 'N/A')[:200] + "...")


if __name__ == "__main__":

    reviews_file = "data/yelp_academic_dataset_review.json"
    
    print("=" * 60)
    print("YELP DATASET LOADER")
    print("=" * 60 + "\n")
    
    # Load first 1000 reviews as a test
    reviews = load_yelp_reviews(reviews_file, max_reviews=1000)
    
    if reviews:
        # Show statistics
        print(f"\nDataset Statistics:")
        print(f"Total reviews loaded: {len(reviews)}")
        
        # Show sample review
        analyze_sample_review(reviews[0])
        
        # Save sample to file
        with open('data/yelp_sample_1000.json', 'w') as f:
            json.dump(reviews, f, indent=2)
        print(f"\nSaved sample to data/yelp_sample_1000.json")