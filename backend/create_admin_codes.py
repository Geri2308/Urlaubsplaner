#!/usr/bin/env python3
"""
Create admin codes for the 4-digit login system
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime

# Load environment
load_dotenv()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def create_admin_codes():
    """Create demo admin codes"""
    print("🔐 Creating admin codes for 4-digit login system...")
    
    # Clear existing codes
    await db.admin_codes.delete_many({})
    print("🗑️  Cleared existing admin codes")
    
    # Demo admin codes
    admin_codes = [
        {
            "code": "1234",
            "role": "admin",
            "created_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "code": "9999",
            "role": "admin",
            "created_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "code": "5678",
            "role": "manager",
            "created_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "code": "0000",
            "role": "employee",
            "created_at": datetime.utcnow(),
            "is_active": True
        }
    ]
    
    await db.admin_codes.insert_many(admin_codes)
    
    print("✅ Created admin codes:")
    for code in admin_codes:
        print(f"  • Code: {code['code']} - Role: {code['role']}")
    
    print("\n🎯 Login-System bereit!")
    print("Verwenden Sie einen der folgenden Codes:")
    print("  • 1234 oder 9999 für Admin-Zugang")
    print("  • 5678 für Manager-Zugang")
    print("  • 0000 für Mitarbeiter-Zugang")
    print("  • Oder klicken Sie 'Nur Ansehen' für Gast-Zugang")

async def main():
    """Main function"""
    try:
        await create_admin_codes()
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())