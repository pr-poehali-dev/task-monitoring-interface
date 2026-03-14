const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, "korpus.db");

app.use(cors());
app.use(express.json());

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
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
`);

function parseTask(row) {
  return {
    id: row.id,
    number: row.number,
    title: row.title,
    description: row.description || "",
    responsible: JSON.parse(row.responsible || "[]"),
    assignedBy: row.assigned_by || "",
    deadline: row.deadline || "",
    status: row.status,
    priority: row.priority,
    section: row.section,
    linkedOrderId: row.linked_order_id || undefined,
  };
}

function parseEmployee(row) {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    position: row.position,
    department: row.department,
    email: row.email || "",
  };
}

function parseComment(row) {
  return {
    id: row.id,
    taskId: row.task_id,
    author: row.author,
    text: row.text,
    date: row.date,
  };
}

// TASKS
app.get("/api/tasks", (req, res) => {
  const rows = db.prepare("SELECT * FROM tasks ORDER BY id DESC").all();
  res.json(rows.map(parseTask));
});

app.post("/api/tasks", (req, res) => {
  const { number, title, description, responsible, assignedBy, deadline, priority, section, linkedOrderId } = req.body;
  const stmt = db.prepare(
    "INSERT INTO tasks (number, title, description, responsible, assigned_by, deadline, status, priority, section, linked_order_id) VALUES (?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)"
  );
  const result = stmt.run(
    number, title, description || "", JSON.stringify(responsible || []),
    assignedBy || "", deadline || "", priority || "medium", section || "order",
    linkedOrderId || null
  );
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);
  res.json(parseTask(row));
});

app.patch("/api/tasks/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const patch = req.body;
  const fieldMap = {
    title: "title", description: "description", responsible: "responsible",
    assignedBy: "assigned_by", deadline: "deadline", status: "status",
    priority: "priority", section: "section", linkedOrderId: "linked_order_id",
  };
  const sets = [];
  const values = [];
  for (const [key, col] of Object.entries(fieldMap)) {
    if (patch[key] !== undefined) {
      sets.push(`${col} = ?`);
      values.push(key === "responsible" ? JSON.stringify(patch[key]) : patch[key]);
    }
  }
  if (sets.length === 0) return res.status(400).json({ error: "No fields to update" });
  values.push(id);
  db.prepare(`UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(parseTask(row));
});

app.delete("/api/tasks/:id", (req, res) => {
  const id = parseInt(req.params.id);
  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  res.json({ ok: true });
});

// COMMENTS
app.get("/api/tasks/:taskId/comments", (req, res) => {
  const taskId = parseInt(req.params.taskId);
  const rows = db.prepare("SELECT * FROM comments WHERE task_id = ? ORDER BY id ASC").all(taskId);
  res.json(rows.map(parseComment));
});

app.post("/api/tasks/:taskId/comments", (req, res) => {
  const taskId = parseInt(req.params.taskId);
  const { author, text, date } = req.body;
  const result = db.prepare("INSERT INTO comments (task_id, author, text, date) VALUES (?, ?, ?, ?)").run(taskId, author, text, date);
  const row = db.prepare("SELECT * FROM comments WHERE id = ?").get(result.lastInsertRowid);
  res.json(parseComment(row));
});

// EMPLOYEES
app.get("/api/employees", (req, res) => {
  const rows = db.prepare("SELECT * FROM employees ORDER BY name ASC").all();
  res.json(rows.map(parseEmployee));
});

app.post("/api/employees", (req, res) => {
  const { name, shortName, position, department, email } = req.body;
  const result = db.prepare(
    "INSERT INTO employees (name, short_name, position, department, email) VALUES (?, ?, ?, ?, ?)"
  ).run(name, shortName, position, department, email || "");
  const row = db.prepare("SELECT * FROM employees WHERE id = ?").get(result.lastInsertRowid);
  res.json(parseEmployee(row));
});

app.delete("/api/employees/:id", (req, res) => {
  const id = parseInt(req.params.id);
  db.prepare("DELETE FROM employees WHERE id = ?").run(id);
  res.json({ ok: true });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
  console.log(`База данных: ${DB_PATH}`);
  console.log(`Для остановки нажмите Ctrl+C`);
});
