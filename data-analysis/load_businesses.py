print("Script started!")
from pymongo import MongoClient
import json

def connect_to_mongodb():
    """Connect to MongoDB"""
    client = MongoClient('mongodb://localhost:27017/')
    db = client['review_analyzer']
    return db

def load_businesses(file_path, max_businesses=5000):
    """Load business data from JSON file"""
    
    print(f"Loading businesses from {file_path}...")
    
    db = connect_to_mongodb()
    businesses_collection = db['businesses']
    
    # Clear existing data
    businesses_collection.delete_many({})
    print("Cleared existing business data")
    
    businesses_loaded = 0
    batch = []
    batch_size = 1000
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f):
                if i >= max_businesses:
                    break
                
                try:
                    business = json.loads(line)
                    batch.append(business)
                    
                    if len(batch) >= batch_size:
                        businesses_collection.insert_many(batch)
                        businesses_loaded += len(batch)
                        print(f"Loaded {businesses_loaded} businesses...")
                        batch = []
                        
                except json.JSONDecodeError as e:
                    print(f"Error parsing line {i}: {e}")
                    continue
            
            # Insert remaining
            if batch:
                businesses_collection.insert_many(batch)
                businesses_loaded += len(batch)
                print(f"Loaded {businesses_loaded} businesses...")
        
        print(f"\nSuccessfully loaded {businesses_loaded} businesses!")
        
        # Show sample
        sample = businesses_collection.find_one()
        if sample:
            print(f"\nSample business:")
            print(f"  Name: {sample.get('name')}")
            print(f"  Business ID: {sample.get('business_id')}")
            print(f"  City: {sample.get('city')}")
            print(f"  State: {sample.get('state')}")
        
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    businesses_file = "data/yelp_academic_dataset_business.json"
    
    print("=" * 60)
    print("LOAD BUSINESS DATA INTO MONGODB")
    print("=" * 60 + "\n")
    
    load_businesses(businesses_file, max_businesses=5000)