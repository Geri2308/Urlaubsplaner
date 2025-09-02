#!/usr/bin/env python3
"""
Fix skills for employees - Add demo skills to all employees
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment
load_dotenv()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Demo skills for different roles
DEMO_SKILLS = {
    "admin": [
        {"name": "Führung", "rating": 5},
        {"name": "Projektmanagement", "rating": 4},
        {"name": "Strategieplanung", "rating": 4},
        {"name": "Teamleitung", "rating": 5},
        {"name": "Budgetplanung", "rating": 4}
    ],
    "employee": [
        {"name": "JavaScript", "rating": 4},
        {"name": "Python", "rating": 3},
        {"name": "React", "rating": 4},
        {"name": "SQL", "rating": 3},
        {"name": "Teamarbeit", "rating": 5},
        {"name": "Problemlösung", "rating": 4},
        {"name": "Kommunikation", "rating": 4},
        {"name": "HTML/CSS", "rating": 4},
        {"name": "Git", "rating": 3},
        {"name": "Agile Methoden", "rating": 3}
    ],
    "leiharbeiter": [
        {"name": "Flexibilität", "rating": 5},
        {"name": "Schnelle Einarbeitung", "rating": 4},
        {"name": "Anpassungsfähigkeit", "rating": 5},
        {"name": "Zuverlässigkeit", "rating": 4}
    ]
}

async def add_skills_to_employees():
    """Add demo skills to all employees"""
    print("🔧 Fixing employee skills...")
    
    # Get all employees
    employees = await db.employees.find().to_list(1000)
    print(f"📊 Found {len(employees)} employees")
    
    updated_count = 0
    
    for employee in employees:
        role = employee.get('role', 'employee')
        
        # Get appropriate skills for this role
        if role == 'admin':
            skills = DEMO_SKILLS['admin'].copy()
        elif role == 'leiharbeiter':
            skills = DEMO_SKILLS['leiharbeiter'].copy()
        else:
            # For regular employees, give them 3-5 random skills
            import random
            available_skills = DEMO_SKILLS['employee'].copy()
            random.shuffle(available_skills)
            skills = available_skills[:random.randint(3, 5)]
        
        # Add some variation to admin skills
        if role == 'admin' and employee['name'] == 'Thomas Müller':
            skills.append({"name": "IT-Management", "rating": 5})
            skills.append({"name": "Digitalisierung", "rating": 4})
        elif role == 'admin' and employee['name'] == 'Anna Schmidt':
            skills.append({"name": "HR-Management", "rating": 5})
            skills.append({"name": "Personalentwicklung", "rating": 4})
        
        # Update employee with skills
        await db.employees.update_one(
            {"id": employee["id"]},
            {"$set": {"skills": skills}}
        )
        
        updated_count += 1
        print(f"✅ Updated {employee['name']} ({role}) with {len(skills)} skills")
    
    print(f"🎉 Successfully updated {updated_count} employees with skills!")

async def verify_skills():
    """Verify that skills were added correctly"""
    print("\n🔍 Verifying skills...")
    
    employees = await db.employees.find().to_list(1000)
    
    for employee in employees[:5]:  # Show first 5 as examples
        skills = employee.get('skills', [])
        print(f"📋 {employee['name']} ({employee['role']}): {len(skills)} skills")
        for skill in skills[:3]:  # Show first 3 skills
            print(f"   • {skill['name']}: {'⭐' * skill['rating']}")
        if len(skills) > 3:
            print(f"   ... and {len(skills) - 3} more")
        print()

async def main():
    """Main function"""
    try:
        await add_skills_to_employees()
        await verify_skills()
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())