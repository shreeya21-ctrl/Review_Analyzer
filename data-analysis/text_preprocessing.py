import re
import string
from collections import Counter

def clean_text(text):
    """
    Clean and normalize review text
    
    Args:
        text: Raw review text
    
    Returns:
        Cleaned text string
    """
    if not text:
        return ""
    
    # Convert to lowercase
    text = text.lower()
    
    # Remove URLs
    text = re.sub(r'http\S+|www\S+', '', text)
    
    # Remove email addresses
    text = re.sub(r'\S+@\S+', '', text)
    
    # Remove extra whitespace
    text = ' '.join(text.split())
    
    return text


def remove_punctuation(text):
    """Remove punctuation from text"""
    translator = str.maketrans('', '', string.punctuation)
    return text.translate(translator)


def tokenize(text):
    """Split text into individual words"""
    return text.split()


def remove_stopwords(tokens):
    """
    Remove common words that don't add meaning
    """
    stopwords = set([
        'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 
        'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself',
        'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them',
        'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this',
        'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
        'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
        'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
        'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
        'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to',
        'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
        'further', 'then', 'once'
    ])
    
    return [word for word in tokens if word not in stopwords]


def preprocess_review(text):
    """
    Complete preprocessing pipeline for a review
    
    Args:
        text: Raw review text
    
    Returns:
        Dictionary with original and processed text
    """
    # Clean text
    cleaned = clean_text(text)
    
    # Remove punctuation
    no_punct = remove_punctuation(cleaned)
    
    # Tokenize
    tokens = tokenize(no_punct)
    
    # Remove stopwords
    filtered_tokens = remove_stopwords(tokens)
    
    return {
        'original': text,
        'cleaned': cleaned,
        'tokens': filtered_tokens,
        'word_count': len(filtered_tokens)
    }


def get_word_frequency(tokens):
    """Get frequency count of words"""
    return Counter(tokens)


# Test the preprocessing
if __name__ == "__main__":
    sample_text = "This is THE BEST restaurant! I absolutely LOVE their pizza. Would definitely recommend!"
    
    print("=" * 60)
    print("TEXT PREPROCESSING TEST")
    print("=" * 60)
    print(f"\nOriginal: {sample_text}")
    
    result = preprocess_review(sample_text)
    
    print(f"\nCleaned: {result['cleaned']}")
    print(f"\nTokens: {result['tokens']}")
    print(f"\nWord count: {result['word_count']}")
    
    freq = get_word_frequency(result['tokens'])
    print(f"\nTop words: {freq.most_common(5)}")