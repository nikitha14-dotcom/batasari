from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_india_cities_are_in_inr_and_can_be_filtered():
    response = client.get("/india/cities", params={"q": "Mum"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["currency"] == "INR"
    assert [city["name"] for city in payload["cities"]] == ["Mumbai"]
    assert payload["cities"][0]["languages"]

    surat = client.get("/india/cities", params={"q": "Surat"})
    assert surat.status_code == 200
    assert surat.json()["cities"][0]["state"] == "Gujarat"


def test_india_checklist_rejects_unknown_move_type():
    response = client.get("/india/checklists/not-a-move")

    assert response.status_code == 404


def test_local_user_can_create_list_and_update_move_plan():
    created = client.post(
        "/india/move-plans",
        json={
            "title": "Move to Bengaluru",
            "move_type": "within_india",
            "origin_city": "Pune",
            "destination_city": "Bengaluru",
            "household_size": 2,
            "services": ["packers_movers", "local_transport"],
        },
    )

    assert created.status_code == 201
    plan = created.json()
    assert plan["status"] == "planning"
    assert plan["destination_city"] == "Bengaluru"

    listed = client.get("/india/move-plans")
    assert listed.status_code == 200
    assert plan["id"] in [item["id"] for item in listed.json()["move_plans"]]

    updated = client.patch(f"/india/move-plans/{plan['id']}", json={"title": "Pune to Bengaluru"})
    assert updated.status_code == 200
    assert updated.json()["title"] == "Pune to Bengaluru"

    deleted = client.delete(f"/india/move-plans/{plan['id']}")
    assert deleted.status_code == 200
    assert deleted.json() == {"deleted": True}


def test_move_from_abroad_requires_origin_country():
    response = client.post(
        "/india/move-plans",
        json={
            "title": "Move home",
            "move_type": "returning_to_india",
            "destination_city": "Chennai",
        },
    )

    assert response.status_code == 422

