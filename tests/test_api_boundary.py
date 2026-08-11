import hashlib
import os
import subprocess
import unittest
from unittest.mock import patch

TEST_TOKEN = "test-only-engine-token-with-32-chars"
os.environ["STARGLASS_ENGINE_TOKEN_SHA256"] = hashlib.sha256(TEST_TOKEN.encode()).hexdigest()

from fastapi import HTTPException
from fastapi.testclient import TestClient

from api.main import MAX_REQUEST_BYTES, app, calculate


class EngineBoundaryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.auth = {"authorization": f"Bearer {TEST_TOKEN}"}

    def test_health_is_public_and_minimal(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"ok": True})

    def test_schema_and_documentation_routes_are_not_public(self):
        self.assertEqual(self.client.get("/docs").status_code, 404)
        self.assertEqual(self.client.get("/redoc").status_code, 404)
        self.assertEqual(self.client.get("/openapi.json").status_code, 404)

    def test_protected_route_rejects_missing_and_wrong_tokens(self):
        self.assertEqual(self.client.post("/chart", json={}).status_code, 401)
        wrong = self.client.post("/chart", json={}, headers={"authorization": "Bearer wrong"})
        self.assertEqual(wrong.status_code, 401)
        self.assertNotIn("access-control-allow-origin", wrong.headers)

    def test_verifier_configuration_fails_closed_and_supports_rotation(self):
        with patch.dict(os.environ, {"STARGLASS_ENGINE_TOKEN_SHA256": "invalid"}):
            self.assertEqual(self.client.post("/chart", json={}, headers=self.auth).status_code, 503)

        replacement = "replacement-test-token-with-enough-entropy"
        replacement_digest = hashlib.sha256(replacement.encode()).hexdigest()
        original_digest = hashlib.sha256(TEST_TOKEN.encode()).hexdigest()
        with patch.dict(
            os.environ,
            {"STARGLASS_ENGINE_TOKEN_SHA256": f"{original_digest},{replacement_digest}"},
        ):
            old_response = self.client.post("/chart", json={}, headers=self.auth)
            new_response = self.client.post(
                "/chart",
                json={},
                headers={"authorization": f"Bearer {replacement}"},
            )
        self.assertEqual(old_response.status_code, 422)
        self.assertEqual(new_response.status_code, 422)

    def test_policy_runs_before_body_parsing(self):
        response = self.client.post("/chart", content=b"not-json", headers={"content-type": "text/plain"})
        self.assertEqual(response.status_code, 401)
        authenticated = self.client.post(
            "/chart",
            content=b"not-json",
            headers={**self.auth, "content-type": "text/plain"},
        )
        self.assertEqual(authenticated.status_code, 415)

    def test_method_and_body_size_are_bounded(self):
        self.assertEqual(self.client.get("/chart", headers=self.auth).status_code, 405)
        oversized = self.client.post(
            "/chart",
            content=b"x" * (MAX_REQUEST_BYTES + 1),
            headers={**self.auth, "content-type": "application/json"},
        )
        self.assertEqual(oversized.status_code, 413)

    def test_valid_authenticated_chart_reaches_endpoint(self):
        birth = {
            "date": "1986-03-15",
            "time": "14:30",
            "tz": "America/Chicago",
            "lat": 44.98,
            "lon": -93.26,
            "zodiac": "tropical",
            "house_system": "P",
            "orbs": "standard",
            "quincunx": False,
            "minor_aspects": False,
            "vedic": False,
        }
        with patch("api.main.calculate", return_value={"input": birth, "tropical": {}}):
            response = self.client.post("/chart", json=birth, headers=self.auth)
        self.assertEqual(response.status_code, 200)
        self.assertIn("tropical", response.json())

    def test_calculation_timeout_is_sanitized(self):
        birth = {
            "date": "1986-03-15",
            "time": "14:30",
            "tz": "America/Chicago",
            "lat": 44.98,
            "lon": -93.26,
        }
        from api.main import BirthData

        with patch("api.main.subprocess.run", side_effect=subprocess.TimeoutExpired("secret-command", 45)):
            with self.assertRaises(HTTPException) as raised:
                calculate(BirthData(**birth))
        self.assertEqual(raised.exception.status_code, 504)
        self.assertEqual(raised.exception.detail, "calculation timed out")


if __name__ == "__main__":
    unittest.main()
