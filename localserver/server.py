"""
Локальный сервер для офлайн-работы.
База данных SQLite создаётся автоматически в папке localserver.

Запуск:
    python server.py

Требования: Python 3.8+, установить зависимости:
    pip install flask flask-cors
"""

import json
import os
import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DB_PATH = os.path.join(os.path.dirname(__file__), "korpus.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS employees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                short_name TEXT NOT NULL,
                position TEXT NOT NULL,
                department TEXT NOT NULL,
                email TEXT
            );

            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                number TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                responsible TEXT NOT NULL DEFAULT '[]',
                assigned_by TEXT,
                deadline TEXT,
                status TEXT NOT NULL DEFAULT 'new',
                priority TEXT NOT NULL DEFAULT 'medium',
                section TEXT NOT NULL DEFAULT 'order',
                linked_order_id INTEGER
            );

            CREATE TABLE IF NOT EXISTS comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                author TEXT NOT NULL,
                text TEXT NOT NULL,
                date TEXT NOT NULL,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            );
        """)


def parse_task(row):
    return {
        "id": row["id"],
        "number": row["number"],
        "title": row["title"],
        "description": row["description"] or "",
        "responsible": json.loads(row["responsible"] or "[]"),
        "assignedBy": row["assigned_by"] or "",
        "deadline": row["deadline"] or "",
        "status": row["status"],
        "priority": row["priority"],
        "section": row["section"],
        "linkedOrderId": row["linked_order_id"],
    }


def parse_employee(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "shortName": row["short_name"],
        "position": row["position"],
        "department": row["department"],
        "email": row["email"] or "",
    }


def parse_comment(row):
    return {
        "id": row["id"],
        "taskId": row["task_id"],
        "author": row["author"],
        "text": row["text"],
        "date": row["date"],
    }


# ── TASKS ─────────────────────────────────────────────────────────────────────

@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM tasks ORDER BY id DESC").fetchall()
    return jsonify([parse_task(r) for r in rows])


@app.route("/api/tasks", methods=["POST"])
def create_task():
    data = request.json
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO tasks (number, title, description, responsible, assigned_by, deadline, status, priority, section, linked_order_id) VALUES (?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)",
            (
                data["number"], data["title"], data.get("description", ""),
                json.dumps(data.get("responsible", [])),
                data.get("assignedBy", ""), data.get("deadline", ""),
                data.get("priority", "medium"), data.get("section", "order"),
                data.get("linkedOrderId"),
            ),
        )
        row = conn.execute("SELECT * FROM tasks WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify(parse_task(row))


@app.route("/api/tasks/<int:task_id>", methods=["PATCH"])
def update_task(task_id):
    data = request.json
    field_map = {
        "title": "title", "description": "description", "responsible": "responsible",
        "assignedBy": "assigned_by", "deadline": "deadline", "status": "status",
        "priority": "priority", "section": "section", "linkedOrderId": "linked_order_id",
    }
    sets, values = [], []
    for key, col in field_map.items():
        if key in data:
            sets.append(f"{col} = ?")
            values.append(json.dumps(data[key]) if key == "responsible" else data[key])
    if not sets:
        return jsonify({"error": "No fields to update"}), 400
    values.append(task_id)
    with get_db() as conn:
        conn.execute(f"UPDATE tasks SET {', '.join(sets)} WHERE id = ?", values)
        row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    if not row:
        return jsonify({"error": "Not found"}), 404
    return jsonify(parse_task(row))


@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    with get_db() as conn:
        conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    return jsonify({"ok": True})


# ── COMMENTS ──────────────────────────────────────────────────────────────────

@app.route("/api/tasks/<int:task_id>/comments", methods=["GET"])
def get_comments(task_id):
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM comments WHERE task_id = ? ORDER BY id ASC", (task_id,)).fetchall()
    return jsonify([parse_comment(r) for r in rows])


@app.route("/api/tasks/<int:task_id>/comments", methods=["POST"])
def add_comment(task_id):
    data = request.json
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO comments (task_id, author, text, date) VALUES (?, ?, ?, ?)",
            (task_id, data["author"], data["text"], data["date"]),
        )
        row = conn.execute("SELECT * FROM comments WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify(parse_comment(row))


# ── EMPLOYEES ─────────────────────────────────────────────────────────────────

@app.route("/api/employees", methods=["GET"])
def get_employees():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM employees ORDER BY name ASC").fetchall()
    return jsonify([parse_employee(r) for r in rows])


@app.route("/api/employees", methods=["POST"])
def create_employee():
    data = request.json
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO employees (name, short_name, position, department, email) VALUES (?, ?, ?, ?, ?)",
            (data["name"], data["shortName"], data["position"], data["department"], data.get("email", "")),
        )
        row = conn.execute("SELECT * FROM employees WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify(parse_employee(row))


@app.route("/api/employees/<int:emp_id>", methods=["DELETE"])
def delete_employee(emp_id):
    with get_db() as conn:
        conn.execute("DELETE FROM employees WHERE id = ?", (emp_id,))
    return jsonify({"ok": True})


if __name__ == "__main__":
    init_db()
    print(f"Сервер запущен: http://localhost:3001")
    print(f"База данных: {DB_PATH}")
    print(f"Для остановки нажмите Ctrl+C")
    app.run(host="127.0.0.1", port=3001, debug=False)
