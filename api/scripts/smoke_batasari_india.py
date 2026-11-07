"""Run Batasari route smoke checks without the source app's optional integrations."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from app.routers.india import router

smoke_app = FastAPI()
smoke_app.state.local_move_plans = {}


@smoke_app.middleware("http")
async def local_test_identity(request: Request, call_next):
    request.state.user_id = "batasari-smoke-user"
    request.state.use_local_profile_store = True
    return await call_next(request)


smoke_app.include_router(router)


def main():
    with TestClient(smoke_app) as client:
        cities = client.get("/india/cities", params={"q": "Mum"})
        assert cities.status_code == 200 and cities.json()["cities"][0]["name"] == "Mumbai"
        checklist = client.get("/india/checklists/within_india")
        assert checklist.status_code == 200 and checklist.json()["items"]

        created = client.post(
            "/india/move-plans",
            json={
                "title": "Pune to Bengaluru",
                "move_type": "within_india",
                "origin_city": "Pune",
                "destination_city": "Bengaluru",
                "services": ["packers_movers"],
            },
        )
        assert created.status_code == 201, created.text
        plan_id = created.json()["id"]
        assert client.get("/india/move-plans").json()["move_plans"][0]["id"] == plan_id
        updated = client.patch(
            f"/india/move-plans/{plan_id}",
            json={"title": "Pune to Bengaluru move"},
        )
        assert updated.status_code == 200 and updated.json()["title"] == "Pune to Bengaluru move"
        deleted = client.delete(f"/india/move-plans/{plan_id}")
        assert deleted.status_code == 200 and deleted.json() == {"deleted": True}
        assert client.get("/india/move-plans").json()["move_plans"] == []

        invalid = client.post(
            "/india/move-plans",
            json={
                "title": "Returning home",
                "move_type": "returning_to_india",
                "destination_city": "Chennai",
            },
        )
        assert invalid.status_code == 422

    print("Batasari India API smoke checks passed.")


if __name__ == "__main__":
    main()

