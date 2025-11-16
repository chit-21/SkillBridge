from dotenv import load_dotenv
import os

load_dotenv("../.env.local")

print("PROJECT:", os.environ.get("FIREBASE_PROJECT_ID"))
print("EMAIL:", os.environ.get("FIREBASE_CLIENT_EMAIL"))
print("KEY LOADED:", os.environ.get("FIREBASE_PRIVATE_KEY"))
