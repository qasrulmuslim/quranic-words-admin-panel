#!/usr/bin/env python3
"""
Upload Quranic Words to Firestore - SIMPLE VERSION
Just run: python upload_firestore.py
"""

import json
import firebase_admin
from firebase_admin import credentials, firestore

def upload_to_firestore():
    print("🚀 Starting Firestore upload...\n")
    
    # Initialize Firebase
    print("📱 Connecting to Firebase...")
    cred = credentials.Certificate('serviceAccountKey.json')
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Connected!\n")
    
    # Read your data
    print("📖 Reading firestore_data_FIXED.json...")
    with open('firestore_data_FIXED.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    print("✅ Data loaded!\n")
    
    # Upload each level
    for level_name, level_data in data.items():
        print(f"📤 Uploading {level_name}...")
        
        doc_ref = db.collection('quranic_words').document(level_name)
        doc_ref.set(level_data)
        
        # Count words
        total_words = sum(
            len(category_data) if isinstance(category_data, list) else len(category_data)
            for category_data in level_data.values()
        )
        
        print(f"   ✅ {level_name}: {len(level_data)} categories, {total_words} words")
    
    print("\n" + "="*50)
    print("🎉 ALL DONE! Data uploaded successfully!")
    print("="*50)
    print("\n✨ Next steps:")
    print("   1. Go to Firebase Console to verify")
    print("   2. Run your admin panel: npm run dev")
    print("   3. Login and check 'Quranic Words' page")

if __name__ == "__main__":
    try:
        upload_to_firestore()
    except FileNotFoundError as e:
        print(f"\n❌ ERROR: File not found!")
        print(f"   {e}")
        print("\n📁 Make sure you have:")
        print("   - firestore_data_FIXED.json")
        print("   - serviceAccountKey.json")
        print("   Both in the same folder as this script!")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print("\n💡 Make sure:")
        print("   1. Firebase Admin SDK is installed:")
        print("      pip install firebase-admin --break-system-packages")
        print("   2. serviceAccountKey.json is correct")