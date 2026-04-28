import sys
import os

# Add the project root to sys.path
sys.path.append(os.getcwd())

try:
    from app.main import app
    print("Backend imports and app initialization successful!")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
