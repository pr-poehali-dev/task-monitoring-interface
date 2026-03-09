const KEYS = {
  tasks: "korpus_tasks",
  employees: "korpus_employees",
  taskSeq: "korpus_task_seq",
  empSeq: "korpus_emp_seq",
  commentSeq: "korpus_comment_seq",
};

function get<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function set(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function nextId(seqKey: string): number {
  const id = get<number>(seqKey, 0) + 1;
  set(seqKey, id);
  return id;
}

export type Status = "new" | "progress" | "done" | "overdue";
export type Priority = "high" | "medium" | "low";

export interface Comment {
  id: number;
  author: string;
  text: string;
  date: string;
}

export interface Task {
  id: number;
  number: string;
  title: string;
  description: string;
  responsible: string[];
  assignedBy: string;
  deadline: string;
  status: Status;
  priority: Priority;
  comments: Comment[];
  section: "order" | "report";
  linkedOrderId?: number;
}

export interface Employee {
  id: number;
  name: string;
  shortName: string;
  position: string;
  department: string;
  email: string;
}

export const store = {
  getTasks(): Task[] {
    return get<Task[]>(KEYS.tasks, []);
  },

  getEmployees(): Employee[] {
    return get<Employee[]>(KEYS.employees, []);
  },

  createTask(data: Omit<Task, "id" | "status" | "comments">): Task {
    const tasks = store.getTasks();
    const task: Task = { ...data, id: nextId(KEYS.taskSeq), status: "new", comments: [] };
    tasks.push(task);
    set(KEYS.tasks, tasks);
    return task;
  },

  updateTask(id: number, patch: Partial<Omit<Task, "id" | "comments">>): Task | null {
    const tasks = store.getTasks();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    tasks[idx] = { ...tasks[idx], ...patch };
    set(KEYS.tasks, tasks);
    return tasks[idx];
  },

  deleteTask(id: number) {
    const tasks = store.getTasks().filter((t) => t.id !== id);
    set(KEYS.tasks, tasks);
  },

  addComment(taskId: number, author: string, text: string, date: string): Comment | null {
    const tasks = store.getTasks();
    const idx = tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) return null;
    const comment: Comment = { id: nextId(KEYS.commentSeq), author, text, date };
    tasks[idx].comments.push(comment);
    set(KEYS.tasks, tasks);
    return comment;
  },

  createEmployee(data: Omit<Employee, "id">): Employee {
    const employees = store.getEmployees();
    const emp: Employee = { ...data, id: nextId(KEYS.empSeq) };
    employees.push(emp);
    set(KEYS.employees, employees);
    return emp;
  },

  deleteEmployee(id: number) {
    const employees = store.getEmployees().filter((e) => e.id !== id);
    set(KEYS.employees, employees);
  },
};
