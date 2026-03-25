from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)


def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    body = response.json()
    assert "Chess Club" in body
    assert isinstance(body["Chess Club"]["participants"], list)


def test_signup_and_refresh():
    email = "pytest-user@example.com"
    signup = client.post(f"/activities/Chess%20Club/signup?email={email}")
    assert signup.status_code == 200
    assert "Signed up" in signup.json()["message"]

    refresh = client.get("/activities")
    assert refresh.status_code == 200
    assert email in refresh.json()["Chess Club"]["participants"]

    cleanup = client.delete(f"/activities/Chess%20Club/participants?email={email}")
    assert cleanup.status_code == 200


def test_duplicate_signup_fails():
    email = "michael@mergington.edu"
    response = client.post(f"/activities/Chess%20Club/signup?email={email}")
    assert response.status_code == 400
    assert "already signed up" in response.json()["detail"]


def test_delete_missing_participant():
    response = client.delete("/activities/Chess%20Club/participants?email=missing@example.com")
    assert response.status_code == 404
    assert "Participant not found" in response.json()["detail"]
