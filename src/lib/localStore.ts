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

export const db = new AppDatabase();

async function migrateFromLocalStorage() {
  const migrated = localStorage.getItem("korpus_idb_migrated");
  if (migrated) return;

  try {
    const tasksRaw = localStorage.getItem("korpus_tasks");
    const employeesRaw = localStorage.getItem("korpus_employees");

    if (employeesRaw) {
      const employees: (Employee & { id: number })[] = JSON.parse(employeesRaw);
      for (const emp of employees) {
        await db.employees.put(emp);
      }
    }

    if (tasksRaw) {
      const tasks: (Task & { id: number; comments: (Comment & { id: number })[] })[] =
        JSON.parse(tasksRaw);
      for (const task of tasks) {
        const { comments, ...taskData } = task;
        await db.tasks.put(taskData);
        if (comments?.length) {
          for (const c of comments) {
            await db.comments.put({ ...c, taskId: task.id });
          }
        }
      }
    }

    localStorage.setItem("korpus_idb_migrated", "1");
  } catch {
    // ignore migration errors
  }
}

migrateFromLocalStorage();

export const store = {
  async getTasks(): Promise<Task[]> {
    return db.tasks.toArray();
  },

  async getEmployees(): Promise<Employee[]> {
    return db.employees.toArray();
  },

  async getComments(taskId: number): Promise<Comment[]> {
    return db.comments.where("taskId").equals(taskId).toArray();
  },

  async createTask(data: Omit<Task, "id">): Promise<Task> {
    const id = await db.tasks.add({ ...data, status: "new" });
    return { ...data, id, status: "new" };
  },

  async updateTask(id: number, patch: Partial<Omit<Task, "id">>): Promise<Task | null> {
    await db.tasks.update(id, patch);
    return db.tasks.get(id) ?? null;
  },

  async deleteTask(id: number): Promise<void> {
    await db.tasks.delete(id);
    await db.comments.where("taskId").equals(id).delete();
  },

  async addComment(taskId: number, author: string, text: string, date: string): Promise<Comment> {
    const comment: Comment = { taskId, author, text, date };
    const id = await db.comments.add(comment);
    return { ...comment, id };
  },

  async createEmployee(data: Omit<Employee, "id">): Promise<Employee> {
    const id = await db.employees.add(data);
    return { ...data, id };
  },

  async deleteEmployee(id: number): Promise<void> {
    await db.employees.delete(id);
  },
};
