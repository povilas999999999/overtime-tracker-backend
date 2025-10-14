#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for Overtime Tracking System
Tests all API endpoints with realistic data
"""

import requests
import json
import base64
from datetime import datetime
import time

# Backend URL from environment
BACKEND_URL = "https://worklog-app-10.preview.emergentagent.com/api"

# Test data
TEST_SETTINGS = {
    "reminder_interval": 20,
    "reminder_duration": 15,
    "recipient_email": "john.doe@company.com",
    "work_location": {
        "latitude": 54.6872,
        "longitude": 25.2797,
        "radius": 100
    }
}

TEST_SESSION_START = {
    "date": "2025-01-15",
    "latitude": 54.6872,
    "longitude": 25.2797
}

# Sample base64 image (small test image)
TEST_IMAGE_BASE64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A"

class OvertimeAPITester:
    def __init__(self):
        self.session_id = None
        self.test_results = []
        
    def log_result(self, test_name, success, message, response_data=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        if response_data:
            result["response"] = response_data
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if not success and response_data:
            print(f"   Response: {response_data}")
    
    def test_health_check(self):
        """Test GET /api/ - Health check"""
        try:
            response = requests.get(f"{BACKEND_URL}/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_result("Health Check", True, f"API is running: {data['message']}", data)
                    return True
                else:
                    self.log_result("Health Check", False, "Response missing 'message' field", data)
                    return False
            else:
                self.log_result("Health Check", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_get_settings(self):
        """Test GET /api/settings - Get app settings"""
        try:
            response = requests.get(f"{BACKEND_URL}/settings", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "settings" in data:
                    settings = data["settings"]
                    required_fields = ["id", "reminder_interval", "reminder_duration", "recipient_email"]
                    missing_fields = [field for field in required_fields if field not in settings]
                    
                    if not missing_fields:
                        self.log_result("Get Settings", True, f"Settings retrieved successfully", data)
                        return True
                    else:
                        self.log_result("Get Settings", False, f"Missing fields: {missing_fields}", data)
                        return False
                else:
                    self.log_result("Get Settings", False, "Response missing 'settings' field", data)
                    return False
            else:
                self.log_result("Get Settings", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Get Settings", False, f"Request error: {str(e)}")
            return False
    
    def test_update_settings(self):
        """Test POST /api/settings - Update settings"""
        try:
            response = requests.post(
                f"{BACKEND_URL}/settings",
                json=TEST_SETTINGS,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "settings" in data:
                    settings = data["settings"]
                    # Verify the updated values
                    if (settings.get("reminder_interval") == TEST_SETTINGS["reminder_interval"] and
                        settings.get("recipient_email") == TEST_SETTINGS["recipient_email"]):
                        self.log_result("Update Settings", True, "Settings updated successfully", data)
                        return True
                    else:
                        self.log_result("Update Settings", False, "Settings not properly updated", data)
                        return False
                else:
                    self.log_result("Update Settings", False, "Invalid response format", data)
                    return False
            else:
                self.log_result("Update Settings", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Update Settings", False, f"Request error: {str(e)}")
            return False
    
    def test_get_current_schedule(self):
        """Test GET /api/schedule/current - Get current work schedule"""
        try:
            response = requests.get(f"{BACKEND_URL}/schedule/current", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "schedule" in data:
                    # Schedule can be None if no schedule uploaded
                    self.log_result("Get Current Schedule", True, f"Schedule retrieved: {data['schedule'] is not None}", data)
                    return True
                else:
                    self.log_result("Get Current Schedule", False, "Response missing 'schedule' field", data)
                    return False
            else:
                self.log_result("Get Current Schedule", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Get Current Schedule", False, f"Request error: {str(e)}")
            return False
    
    def test_start_session(self):
        """Test POST /api/session/start - Start work session"""
        try:
            response = requests.post(
                f"{BACKEND_URL}/session/start",
                json=TEST_SESSION_START,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "session" in data:
                    session = data["session"]
                    if "id" in session and "start_time" in session:
                        self.session_id = session["id"]
                        self.log_result("Start Session", True, f"Session started with ID: {self.session_id}", data)
                        return True
                    else:
                        self.log_result("Start Session", False, "Session missing required fields", data)
                        return False
                else:
                    self.log_result("Start Session", False, "Invalid response format", data)
                    return False
            else:
                self.log_result("Start Session", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Start Session", False, f"Request error: {str(e)}")
            return False
    
    def test_get_active_session(self):
        """Test GET /api/session/active - Get active session"""
        try:
            response = requests.get(f"{BACKEND_URL}/session/active", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "session" in data:
                    session = data["session"]
                    if session and "id" in session:
                        if session["id"] == self.session_id:
                            self.log_result("Get Active Session", True, f"Active session found: {session['id']}", data)
                            return True
                        else:
                            self.log_result("Get Active Session", False, f"Session ID mismatch. Expected: {self.session_id}, Got: {session['id']}", data)
                            return False
                    elif session is None:
                        self.log_result("Get Active Session", False, "No active session found", data)
                        return False
                    else:
                        self.log_result("Get Active Session", False, "Session missing ID field", data)
                        return False
                else:
                    self.log_result("Get Active Session", False, "Response missing 'session' field", data)
                    return False
            else:
                self.log_result("Get Active Session", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Get Active Session", False, f"Request error: {str(e)}")
            return False
    
    def test_add_photo(self):
        """Test POST /api/session/photo - Add photo to session"""
        if not self.session_id:
            self.log_result("Add Photo", False, "No active session ID available")
            return False
        
        try:
            photo_data = {
                "session_id": self.session_id,
                "photo_base64": TEST_IMAGE_BASE64
            }
            response = requests.post(
                f"{BACKEND_URL}/session/photo",
                json=photo_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "photo_count" in data:
                    photo_count = data["photo_count"]
                    if photo_count > 0:
                        self.log_result("Add Photo", True, f"Photo added successfully. Total photos: {photo_count}", data)
                        return True
                    else:
                        self.log_result("Add Photo", False, "Photo count is 0 after adding photo", data)
                        return False
                else:
                    self.log_result("Add Photo", False, "Invalid response format", data)
                    return False
            else:
                self.log_result("Add Photo", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Add Photo", False, f"Request error: {str(e)}")
            return False
    
    def test_end_session(self):
        """Test POST /api/session/end - End work session"""
        if not self.session_id:
            self.log_result("End Session", False, "No active session ID available")
            return False
        
        try:
            end_data = {
                "session_id": self.session_id,
                "latitude": TEST_SESSION_START["latitude"],
                "longitude": TEST_SESSION_START["longitude"]
            }
            response = requests.post(
                f"{BACKEND_URL}/session/end",
                json=end_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "session" in data:
                    session = data["session"]
                    if "end_time" in session and session["end_time"] is not None:
                        self.log_result("End Session", True, f"Session ended successfully. Overtime: {session.get('overtime_minutes', 0)} minutes", data)
                        return True
                    else:
                        self.log_result("End Session", False, "Session end_time not set", data)
                        return False
                else:
                    self.log_result("End Session", False, "Invalid response format", data)
                    return False
            else:
                self.log_result("End Session", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("End Session", False, f"Request error: {str(e)}")
            return False
    
    def test_session_history(self):
        """Test GET /api/sessions/history - Get session history"""
        try:
            response = requests.get(f"{BACKEND_URL}/sessions/history", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "sessions" in data:
                    sessions = data["sessions"]
                    if isinstance(sessions, list):
                        session_count = len(sessions)
                        # Check if our test session is in the history
                        test_session_found = any(s.get("id") == self.session_id for s in sessions) if self.session_id else False
                        
                        self.log_result("Session History", True, f"Retrieved {session_count} sessions. Test session found: {test_session_found}", {"session_count": session_count})
                        return True
                    else:
                        self.log_result("Session History", False, "Sessions is not a list", data)
                        return False
                else:
                    self.log_result("Session History", False, "Response missing 'sessions' field", data)
                    return False
            else:
                self.log_result("Session History", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Session History", False, f"Request error: {str(e)}")
            return False
    
    def test_error_handling(self):
        """Test error handling for missing session IDs"""
        try:
            # Test adding photo to non-existent session
            photo_data = {
                "session_id": "non-existent-session-id",
                "photo_base64": TEST_IMAGE_BASE64
            }
            response = requests.post(
                f"{BACKEND_URL}/session/photo",
                json=photo_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 404:
                self.log_result("Error Handling - Invalid Session Photo", True, "Correctly returned 404 for non-existent session")
                return True
            else:
                self.log_result("Error Handling - Invalid Session Photo", False, f"Expected 404, got {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Error Handling - Invalid Session Photo", False, f"Request error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all API tests in sequence"""
        print(f"🚀 Starting Overtime Tracking API Tests")
        print(f"📍 Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Test sequence
        tests = [
            ("Health Check", self.test_health_check),
            ("Get Settings", self.test_get_settings),
            ("Update Settings", self.test_update_settings),
            ("Get Current Schedule", self.test_get_current_schedule),
            ("Start Session", self.test_start_session),
            ("Get Active Session", self.test_get_active_session),
            ("Add Photo", self.test_add_photo),
            ("End Session", self.test_end_session),
            ("Session History", self.test_session_history),
            ("Error Handling", self.test_error_handling)
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                self.log_result(test_name, False, f"Test execution error: {str(e)}")
                failed += 1
            
            # Small delay between tests
            time.sleep(0.5)
        
        print("=" * 60)
        print(f"📊 Test Results: {passed} passed, {failed} failed")
        
        if failed > 0:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['message']}")
        
        return failed == 0

if __name__ == "__main__":
    tester = OvertimeAPITester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed! Backend API is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the details above.")
    
    exit(0 if success else 1)