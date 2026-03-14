import Dexie, { type Table } from "dexie";

export type Status = "new" | "progress" | "done" | "overdue";
export type Priority = "high" | "medium" | "low";

export interface Comment {
  id?: number;
  taskId: number;
  author: string;
  text: string;
  date: string;
}

export interface Task {
  id?: number;
  number: string;
  title: string;
  description: string;
  responsible: string[];
  assignedBy: string;
  deadline: string;
  status: Status;
  priority: Priority;
  section: "order" | "report";
  linkedOrderId?: number;
}

export interface Employee {
  id?: number;
  name: string;
  shortName: string;
  position: string;
  department: string;
  email: string;
}

const LOCAL_API = "http://localhost:3001/api";

async function isLocalServerAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${LOCAL_API}/employees`, { signal: AbortSignal.timeout(500) });
    return res.ok;
  } catch {
    return false;
  }
}

let _useLocalServer: boolean | null = null;

async function getMode(): Promise<boolean> {
  if (_useLocalServer !== null) return _useLocalServer;
  _useLocalServer = await isLocalServerAvailable();
  return _useLocalServer;
}

// ─── IndexedDB (Dexie) ───────────────────────────────────────────────────────

class AppDatabase extends Dexie {
  tasks!: Table<Task, number>;
  comments!: Table<Comment, number>;
  employees!: Table<Employee, number>;

  constructor() {
    super("korpus_db");
    this.version(1).stores({
      tasks: "++id, status, priority, section, linkedOrderId",
      comments: "++id, taskId",
      employees: "++id, shortName",
    });
  }
}

const idb = new AppDatabase();

async function migrateFromLocalStorage() {
  const migrated = localStorage.getItem("korpus_idb_migrated");
  if (migrated) return;
  try {
    const tasksRaw = localStorage.getItem("korpus_tasks");
    const employeesRaw = localStorage.getItem("korpus_employees");
    if (employeesRaw) {
      const employees: (Employee & { id: number })[] = JSON.parse(employeesRaw);
      for (const emp of employees) await idb.employees.put(emp);
    }
    if (tasksRaw) {
      const tasks: (Task & { id: number; comments: (Comment & { id: number })[] })[] = JSON.parse(tasksRaw);
      for (const task of tasks) {
        const { comments, ...taskData } = task;
        await idb.tasks.put(taskData);
        if (comments?.length) {
          for (const c of comments) await idb.comments.put({ ...c, taskId: task.id });
        }
      }
    }
    localStorage.setItem("korpus_idb_migrated", "1");
  } catch {
    // ignore
  }
}

migrateFromLocalStorage();

// ─── REST API (локальный сервер) ─────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${LOCAL_API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  return res.json();
}

// ─── Unified store ───────────────────────────────────────────────────────────

export const store = {
  async getTasks(): Promise<Task[]> {
    if (await getMode()) return apiFetch("/tasks");
    return idb.tasks.toArray();
  },

  async getEmployees(): Promise<Employee[]> {
    if (await getMode()) return apiFetch("/employees");
    return idb.employees.toArray();
  },

  async getComments(taskId: number): Promise<Comment[]> {
    if (await getMode()) return apiFetch(`/tasks/${taskId}/comments`);
    return idb.comments.where("taskId").equals(taskId).toArray();
  },

  async createTask(data: Omit<Task, "id">): Promise<Task> {
    if (await getMode()) {
      return apiFetch("/tasks", { method: "POST", body: JSON.stringify(data) });
    }
    const id = await idb.tasks.add({ ...data, status: "new" });
    return { ...data, id, status: "new" };
  },

  async updateTask(id: number, patch: Partial<Omit<Task, "id">>): Promise<Task | null> {
    if (await getMode()) {
      return apiFetch(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    }
    await idb.tasks.update(id, patch);
    return (await idb.tasks.get(id)) ?? null;
  },

  async deleteTask(id: number): Promise<void> {
    if (await getMode()) {
      await apiFetch(`/tasks/${id}`, { method: "DELETE" });
      return;
    }
    await idb.tasks.delete(id);
    await idb.comments.where("taskId").equals(id).delete();
  },

  async addComment(taskId: number, author: string, text: string, date: string): Promise<Comment> {
    const comment: Comment = { taskId, author, text, date };
    if (await getMode()) {
      return apiFetch(`/tasks/${taskId}/comments`, { method: "POST", body: JSON.stringify({ author, text, date }) });
    }
    const id = await idb.comments.add(comment);
    return { ...comment, id };
  },

  async createEmployee(data: Omit<Employee, "id">): Promise<Employee> {
    if (await getMode()) {
      return apiFetch("/employees", { method: "POST", body: JSON.stringify(data) });
    }
    const id = await idb.employees.add(data);
    return { ...data, id };
  },

  async deleteEmployee(id: number): Promise<void> {
    if (await getMode()) {
      await apiFetch(`/employees/${id}`, { method: "DELETE" });
      return;
    }
    await idb.employees.delete(id);
  },
};
