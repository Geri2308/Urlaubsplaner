#!/usr/bin/env python3
"""
Add 4-digit codes to existing employees and vacation entries
"""

import asyncio
import os
import random
import string
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment
load_dotenv()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

def generate_4digit_code():
    """Generate a unique 4-digit alphanumeric code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))

async def ensure_unique_employee_code():
    """Generate a unique 4-digit code for employee"""
    while True:
        code = generate_4digit_code()
        existing = await db.employees.find_one({"employee_code": code})
        if not existing:
            return code

async def ensure_unique_vacation_code():
    """Generate a unique 4-digit code for vacation entry"""
    while True:
        code = generate_4digit_code()
        existing = await db.vacation_entries.find_one({"vacation_code": code})
        if not existing:
            return code

async def add_employee_codes():
    """Add 4-digit codes to all employees without codes"""
    print("🔢 Adding employee codes...")
    
    # Find employees without codes
    employees = await db.employees.find({"$or": [{"employee_code": {"$exists": False}}, {"employee_code": ""}]}).to_list(1000)
    print(f"📊 Found {len(employees)} employees without codes")
    
    updated_count = 0
    
    for employee in employees:
        # Generate unique code
        employee_code = await ensure_unique_employee_code()
        
        # Update employee
        await db.employees.update_one(
            {"id": employee["id"]},
            {"$set": {"employee_code": employee_code}}
        )
        
        updated_count += 1
        print(f"✅ Updated {employee['name']}: Code {employee_code}")
    
    print(f"🎉 Successfully added codes to {updated_count} employees!")

async def add_vacation_codes():
    """Add 4-digit codes to all vacation entries without codes"""
    print("\n🗓️  Adding vacation codes...")
    
    # Find vacation entries without codes
    entries = await db.vacation_entries.find({"$or": [{"vacation_code": {"$exists": False}}, {"vacation_code": ""}]}).to_list(1000)
    print(f"📊 Found {len(entries)} vacation entries without codes")
    
    updated_count = 0
    
    for entry in entries:
        # Generate unique code
        vacation_code = await ensure_unique_vacation_code()
        
        # Update vacation entry
        await db.vacation_entries.update_one(
            {"id": entry["id"]},
            {"$set": {"vacation_code": vacation_code}}
        )
        
        updated_count += 1
        print(f"✅ Updated {entry['employee_name']}: Code {vacation_code} ({entry['vacation_type']})")
    
    print(f"🎉 Successfully added codes to {updated_count} vacation entries!")

async def verify_codes():
    """Verify that all employees and vacation entries have codes"""
    print("\n🔍 Verifying codes...")
    
    # Check employees
    employees_without_codes = await db.employees.count_documents({"$or": [{"employee_code": {"$exists": False}}, {"employee_code": ""}]})
    total_employees = await db.employees.count_documents({})
    
    # Check vacation entries
    entries_without_codes = await db.vacation_entries.count_documents({"$or": [{"vacation_code": {"$exists": False}}, {"vacation_code": ""}]})
    total_entries = await db.vacation_entries.count_documents({})
    
    print(f"👥 Employees: {total_employees - employees_without_codes}/{total_employees} have codes")
    print(f"🗓️  Vacation Entries: {total_entries - entries_without_codes}/{total_entries} have codes")
    
    if employees_without_codes == 0 and entries_without_codes == 0:
        print("✅ All records have 4-digit codes!")
    else:
        print("❌ Some records still missing codes")

async def show_sample_codes():
    """Show some examples of the codes"""
    print("\n📋 Sample codes:")
    
    # Show 5 employee codes
    employees = await db.employees.find({"employee_code": {"$exists": True, "$ne": ""}}).limit(5).to_list(5)
    print("Employee codes:")
    for emp in employees:
        print(f"  • {emp['name']}: {emp['employee_code']}")
    
    # Show 5 vacation codes
    entries = await db.vacation_entries.find({"vacation_code": {"$exists": True, "$ne": ""}}).limit(5).to_list(5)
    print("Vacation codes:")
    for entry in entries:
        print(f"  • {entry['employee_name']}: {entry['vacation_code']} ({entry['vacation_type']})")

async def main():
    """Main function"""
    print("🚀 Starting 4-digit code addition process...\n")
    
    try:
        await add_employee_codes()
        await add_vacation_codes()
        await verify_codes()
        await show_sample_codes()
        
        print("\n🎯 4-digit code system successfully implemented!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())