import requests
from bs4 import BeautifulSoup

def test_scraping_setup():
    """Test if our web scraping environment works"""
    print("Testing web scraping setup...")
    
    try:
        # Test with a simple website
        url = "https://example.com"
        response = requests.get(url)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        print(f"Successfully connected to {url}")
        print(f"Page title: {soup.title.string}")
        print("Web scraping setup is working!")
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    test_scraping_setup()