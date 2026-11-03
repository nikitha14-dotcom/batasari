from fastapi.testclient import TestClient

from app.main import app

RUN_ID = "11111111-1111-1111-1111-111111111111"


class Result:
    def __init__(self, data):
        self.data = data


class FakeSupabase:
    def __init__(self):
        self.answer_logs = [{"id": "log-1", "run_id": RUN_ID, "user_id": "user-1"}]
        self.feedback = []
        self.fail = False

    def table(self, name):
        return FakeTable(self, name)

    def rpc(self, name, args):
        assert name == "set_ai_answer_feedback"
        return FakeRatingRpc(self, args)


class FakeRatingRpc:
    def __init__(self, db, args):
        self.db, self.args = db, args

    def execute(self):
        if self.db.fail:
            raise RuntimeError("database unavailable")
        existing = next(
            (
                row for row in self.db.feedback
                if row["answer_log_id"] == self.args["p_answer_log_id"]
                and row["user_id"] == self.args["p_user_id"]
            ),
            None,
        )
        if existing is not None and existing["version"] != self.args["p_expected_version"]:
            return Result([])
        if existing is None:
            row = {
                "answer_log_id": self.args["p_answer_log_id"],
                "user_id": self.args["p_user_id"],
                "rating": self.args["p_rating"],
                "version": 1,
            }
            self.db.feedback.append(row)
        else:
            existing["rating"] = self.args["p_rating"]
            existing["version"] += 1
            row = existing
        return Result([{"rating": row["rating"], "version": row["version"]}])


class FakeTable:
    def __init__(self, db, name):
        self.db, self.name, self.filters, self.operation = db, name, [], None
        self.row = None

    def select(self, *_):
        self.operation = "select"
        return self

    def eq(self, field, value):
        self.filters.append((field, value))
        return self

    def in_(self, field, values):
        self.filters.append((field, set(values)))
        return self

    def limit(self, *_):
        return self

    def upsert(self, row, **_):
        self.operation, self.row = "upsert", row
        return self

    def delete(self):
        self.operation = "delete"
        return self

    def execute(self):
        if self.db.fail:
            raise RuntimeError("database unavailable")
        if self.name == "ai_answer_log":
            rows = self.db.answer_logs
        elif self.name == "ai_answer_feedback_status":
            rows = [
                {
                    "user_id": row["user_id"],
                    "answer_run_id": next(
                        log["run_id"]
                        for log in self.db.answer_logs
                        if log["id"] == row["answer_log_id"]
                    ),
                    "rating": row["rating"],
                    "version": row["version"],
                }
                for row in self.db.feedback
            ]
        else:
            rows = self.db.feedback
        for field, value in self.filters:
            if isinstance(value, set):
                rows = [row for row in rows if row.get(field) in value]
            else:
                rows = [row for row in rows if row.get(field) == value]
        return Result(rows)


def _request(client, method, path, body=None, user="user-1"):
    return client.request(method, path, json=body, headers={"x-test-user-id": user})


def test_answer_rating_create_switch_remove_and_status(monkeypatch):
    db = FakeSupabase()
    monkeypatch.setattr(app.state, "supabase", db, raising=False)
    monkeypatch.setattr("app.routers.answer_feedback.require_active_beta", lambda request: None)
    client = TestClient(app)

    created = _request(
        client, "PUT", f"/ai/answer-feedback/{RUN_ID}", {"rating": 1, "expected_version": 0}
    )
    switched = _request(
        client, "PUT", f"/ai/answer-feedback/{RUN_ID}", {"rating": -1, "expected_version": 1}
    )
    assert created.status_code == 200
    assert switched.status_code == 200
    assert len(db.feedback) == 1
    assert db.feedback[0]["rating"] == -1

    status = _request(client, "POST", "/ai/answer-feedback/status", {"answer_run_ids": [RUN_ID]})
    assert status.json() == {"ratings": {RUN_ID: {"rating": -1, "version": 2}}}

    assert _request(
        client, "DELETE", f"/ai/answer-feedback/{RUN_ID}", {"expected_version": 2}
    ).status_code == 200
    assert db.feedback[0]["rating"] is None


def test_answer_rating_rejects_invalid_and_other_users(monkeypatch):
    db = FakeSupabase()
    monkeypatch.setattr(app.state, "supabase", db, raising=False)
    monkeypatch.setattr("app.routers.answer_feedback.require_active_beta", lambda request: None)
    client = TestClient(app)

    invalid = _request(
        client, "PUT", f"/ai/answer-feedback/{RUN_ID}", {"rating": 0, "expected_version": 0}
    )
    other_user = _request(
        client,
        "PUT",
        f"/ai/answer-feedback/{RUN_ID}",
        {"rating": 1, "expected_version": 0},
        user="user-2",
    )
    assert invalid.status_code == 422
    assert other_user.status_code == 404
    assert db.feedback == []


def test_answer_rating_requires_authentication(monkeypatch):
    db = FakeSupabase()
    monkeypatch.setattr(app.state, "supabase", db, raising=False)
    client = TestClient(app)
    response = client.put(
        f"/ai/answer-feedback/{RUN_ID}",
        json={"rating": 1, "expected_version": 0},
        headers={"authorization": "Bearer "},
    )
    assert response.status_code == 401


def test_answer_rating_database_failure_is_not_exposed(monkeypatch):
    db = FakeSupabase()
    db.fail = True
    monkeypatch.setattr(app.state, "supabase", db, raising=False)
    monkeypatch.setattr("app.routers.answer_feedback.require_active_beta", lambda request: None)
    response = _request(
        TestClient(app),
        "PUT",
        f"/ai/answer-feedback/{RUN_ID}",
        {"rating": 1, "expected_version": 0},
    )
    assert response.status_code == 503
    assert "database unavailable" not in response.text


def test_stale_rating_write_cannot_overwrite_a_newer_selection(monkeypatch):
    db = FakeSupabase()
    monkeypatch.setattr(app.state, "supabase", db, raising=False)
    monkeypatch.setattr("app.routers.answer_feedback.require_active_beta", lambda request: None)
    client = TestClient(app)

    assert _request(
        client, "PUT", f"/ai/answer-feedback/{RUN_ID}", {"rating": 1, "expected_version": 0}
    ).status_code == 200
    stale = _request(
        client, "PUT", f"/ai/answer-feedback/{RUN_ID}", {"rating": -1, "expected_version": 0}
    )
    assert stale.status_code == 409
    assert db.feedback[0]["rating"] == 1
    assert _request(
        client, "PUT", f"/ai/answer-feedback/{RUN_ID}", {"rating": -1, "expected_version": 1}
    ).status_code == 200
    assert db.feedback[0]["rating"] == -1


def test_duplicate_run_ids_are_not_resolved_to_an_arbitrary_answer(monkeypatch):
    db = FakeSupabase()
    db.answer_logs.append({"id": "log-2", "run_id": RUN_ID, "user_id": "user-1"})
    monkeypatch.setattr(app.state, "supabase", db, raising=False)
    monkeypatch.setattr("app.routers.answer_feedback.require_active_beta", lambda request: None)

    response = _request(
        TestClient(app),
        "PUT",
        f"/ai/answer-feedback/{RUN_ID}",
        {"rating": 1, "expected_version": 0},
    )

    assert response.status_code == 404
    assert db.feedback == []


def test_rating_status_derives_its_run_id_from_the_linked_answer_log(monkeypatch):
    db = FakeSupabase()
    db.feedback.append(
        {"answer_log_id": "log-1", "user_id": "user-1", "rating": 1, "version": 4}
    )
    monkeypatch.setattr(app.state, "supabase", db, raising=False)
    monkeypatch.setattr("app.routers.answer_feedback.require_active_beta", lambda request: None)

    response = _request(
        TestClient(app), "POST", "/ai/answer-feedback/status", {"answer_run_ids": [RUN_ID]}
    )

    assert response.json() == {"ratings": {RUN_ID: {"rating": 1, "version": 4}}}

