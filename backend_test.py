import requests
import sys
from datetime import datetime, date
import json

class UrlaubsplanerAPITester:
    def __init__(self, base_url="https://urlaubsplaner.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_employee_id = None
        self.created_vacation_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    elif isinstance(response_data, dict):
                        print(f"   Response keys: {list(response_data.keys())}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health check endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_login_with_code_5678(self):
        """Test login with code 5678 (should work as manager)"""
        login_data = {"access_code": "5678"}
        success, data = self.run_test("Login with Code 5678", "POST", "auth/login", 200, login_data)
        if success:
            expected_role = "manager"
            actual_role = data.get("role", "")
            if data.get("success") and actual_role == expected_role:
                print(f"   ✅ Login successful as {actual_role}")
            else:
                print(f"   ❌ Login failed - Success: {data.get('success')}, Role: {actual_role}")
                success = False
        return success, data

    def test_login_with_invalid_code(self):
        """Test login with invalid code"""
        login_data = {"access_code": "9999"}
        success, data = self.run_test("Login with Invalid Code", "POST", "auth/login", 200, login_data)
        if success:
            # Should return success=false for invalid code
            if not data.get("success"):
                print(f"   ✅ Correctly rejected invalid code")
            else:
                print(f"   ❌ Invalid code was accepted")
                success = False
        return success, data

    def test_get_admin_codes(self):
        """Test get admin codes endpoint"""
        return self.run_test("Get Admin Codes", "GET", "auth/admin-codes", 200)

    def test_get_settings(self):
        """Test get company settings"""
        return self.run_test("Get Settings", "GET", "settings", 200)

    def test_get_employees(self):
        """Test get all employees"""
        success, data = self.run_test("Get All Employees", "GET", "employees", 200)
        if success and isinstance(data, list):
            print(f"   Found {len(data)} employees")
            if len(data) > 0:
                print(f"   Sample employee: {data[0].get('name', 'Unknown')}")
        return success, data

    def test_create_employee(self):
        """Test create employee with skills"""
        employee_data = {
            "name": f"Test Employee {datetime.now().strftime('%H%M%S')}",
            "email": f"test{datetime.now().strftime('%H%M%S')}@test.com",
            "role": "employee",
            "skills": [
                {"name": "Python", "rating": 4},
                {"name": "JavaScript", "rating": 3}
            ]
        }
        
        success, data = self.run_test("Create Employee", "POST", "employees", 200, employee_data)
        if success and data.get('id'):
            self.created_employee_id = data['id']
            print(f"   Created employee ID: {self.created_employee_id}")
        return success, data

    def test_get_employee_by_id(self):
        """Test get employee by ID"""
        if not self.created_employee_id:
            print("❌ Skipped - No employee ID available")
            return False, {}
        
        return self.run_test("Get Employee by ID", "GET", f"employees/{self.created_employee_id}", 200)

    def test_update_employee(self):
        """Test update employee"""
        if not self.created_employee_id:
            print("❌ Skipped - No employee ID available")
            return False, {}
        
        update_data = {
            "name": f"Updated Test Employee {datetime.now().strftime('%H%M%S')}",
            "email": "updated@test.com",
            "role": "admin",
            "skills": [
                {"name": "Python", "rating": 5},
                {"name": "React", "rating": 4},
                {"name": "MongoDB", "rating": 3}
            ]
        }
        
        return self.run_test("Update Employee", "PUT", f"employees/{self.created_employee_id}", 200, update_data)

    def test_create_vacation_entry(self):
        """Test create vacation entry"""
        if not self.created_employee_id:
            print("❌ Skipped - No employee ID available")
            return False, {}
        
        vacation_data = {
            "employee_id": self.created_employee_id,
            "start_date": "2025-03-01",
            "end_date": "2025-03-05",
            "vacation_type": "URLAUB",
            "notes": "Test vacation entry"
        }
        
        success, data = self.run_test("Create Vacation Entry", "POST", "vacation-entries", 200, vacation_data)
        if success and data.get('id'):
            self.created_vacation_id = data['id']
            print(f"   Created vacation ID: {self.created_vacation_id}")
        return success, data

    def test_get_vacation_entries(self):
        """Test get all vacation entries"""
        success, data = self.run_test("Get All Vacation Entries", "GET", "vacation-entries", 200)
        if success and isinstance(data, list):
            print(f"   Found {len(data)} vacation entries")
        return success, data

    def test_get_vacation_entry_by_id(self):
        """Test get vacation entry by ID"""
        if not self.created_vacation_id:
            print("❌ Skipped - No vacation ID available")
            return False, {}
        
        return self.run_test("Get Vacation Entry by ID", "GET", f"vacation-entries/{self.created_vacation_id}", 200)

    def test_update_vacation_entry(self):
        """Test update vacation entry"""
        if not self.created_vacation_id:
            print("❌ Skipped - No vacation ID available")
            return False, {}
        
        update_data = {
            "employee_id": self.created_employee_id,
            "start_date": "2025-03-10",
            "end_date": "2025-03-15",
            "vacation_type": "SONDERURLAUB",
            "notes": "Updated test vacation entry"
        }
        
        return self.run_test("Update Vacation Entry", "PUT", f"vacation-entries/{self.created_vacation_id}", 200, update_data)

    def test_employee_analytics(self):
        """Test employee analytics endpoints"""
        if not self.created_employee_id:
            print("❌ Skipped - No employee ID available")
            return False, {}
        
        # Test vacation summary
        success1, _ = self.run_test("Employee Vacation Summary", "GET", f"analytics/employee-summary/{self.created_employee_id}", 200, params={"year": 2025})
        
        # Test sick days
        success2, _ = self.run_test("Employee Sick Days", "GET", f"analytics/employee-sick-days/{self.created_employee_id}", 200, params={"year": 2025})
        
        return success1 and success2, {}

    def test_team_overview(self):
        """Test team overview analytics"""
        params = {
            "start_date": "2025-01-01",
            "end_date": "2025-12-31"
        }
        return self.run_test("Team Overview", "GET", "analytics/team-overview", 200, params=params)

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete vacation entry
        if self.created_vacation_id:
            success, _ = self.run_test("Delete Vacation Entry", "DELETE", f"vacation-entries/{self.created_vacation_id}", 200)
            if success:
                print("   ✅ Vacation entry deleted")
        
        # Delete employee (this also deletes associated vacation entries)
        if self.created_employee_id:
            success, _ = self.run_test("Delete Employee", "DELETE", f"employees/{self.created_employee_id}", 200)
            if success:
                print("   ✅ Employee deleted")

def main():
    print("🚀 Starting Urlaubsplaner API Tests")
    print("=" * 50)
    
    tester = UrlaubsplanerAPITester()
    
    # Run all tests
    test_methods = [
        tester.test_health_check,
        tester.test_get_settings,
        tester.test_get_employees,
        tester.test_create_employee,
        tester.test_get_employee_by_id,
        tester.test_update_employee,
        tester.test_create_vacation_entry,
        tester.test_get_vacation_entries,
        tester.test_get_vacation_entry_by_id,
        tester.test_update_vacation_entry,
        tester.test_employee_analytics,
        tester.test_team_overview
    ]
    
    for test_method in test_methods:
        try:
            test_method()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
    
    # Cleanup
    tester.cleanup_test_data()
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())