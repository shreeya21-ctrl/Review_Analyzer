from pymongo import MongoClient
import json

def connect_to_mongodb():
    """Connect to MongoDB and return database"""
    try:
        # Connect to MongoDB running on localhost
        client = MongoClient('mongodb://localhost:27017/')
        
        # Create/connect to database
        db = client['review_analyzer']
        
        print("Successfully connected to MongoDB")
        print(f"Database: {db.name}")
        
        return db
    
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        return None


def test_connection():
    """Test MongoDB connection"""
    db = connect_to_mongodb()
    
    if db is not None:
        # List existing collections
        collections = db.list_collection_names()
        print(f"Existing collections: {collections}")
        
        # Insert a test document
        test_collection = db['test']
        result = test_collection.insert_one({'message': 'Hello MongoDB!'})
        print(f"Test document inserted with ID: {result.inserted_id}")
        
        # Read it back
        doc = test_collection.find_one({'message': 'Hello MongoDB!'})
        print(f"Retrieved document: {doc}")
        
        # Clean up test
        test_collection.delete_one({'message': 'Hello MongoDB!'})
        print("Test document deleted")
        
        return True
    
    return False


if __name__ == "__main__":
    print("=" * 60)
    print("MONGODB CONNECTION TEST")
    print("=" * 60 + "\n")
    
    test_connection()