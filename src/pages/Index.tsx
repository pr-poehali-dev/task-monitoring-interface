import { useState } from "react";
import Icon from "@/components/ui/icon";

type Status = "new" | "progress" | "done" | "overdue";
type Priority = "high" | "medium" | "low";
type Section = "orders" | "employees" | "reports";

interface Comment {
  id: number;
  author: string;
  text: string;
  date: string;
}

interface Task {
  id: number;
  number: string;
  title: string;
  description: string;
  responsible: string;
  assignedBy: string;
  deadline: string;
  status: Status;
  priority: Priority;
  comments: Comment[];
  section: "order" | "report";
}

interface Employee {
  id: number;
  name: string;
  shortName: string;
  position: string;
  department: string;
  email: string;
}

const INITIAL_TASKS: Task[] = [
  {
    id: 1,
    number: "УК-2024-001",
    title: "Проверка финансовой отчётности за Q4",
    description: "Провести внутренний аудит финансовых документов за четвёртый квартал 2024 года, сверить данные с бухгалтерией.",
    responsible: "Иванова А.С.",
    assignedBy: "Директор Петров В.И.",
    deadline: "2026-03-20",
    status: "progress",
    priority: "high",
    comments: [
      { id: 1, author: "Иванова А.С.", text: "Начала работу, запросила документы у бухгалтерии.", date: "05.03.2026" },
      { id: 2, author: "Петров В.И.", text: "Срок не переносить, отчёт нужен до конца месяца.", date: "06.03.2026" },
    ],
    section: "order",
  },
  {
    id: 2,
    number: "УК-2024-002",
    title: "Обновление регламента охраны труда",
    description: "Актуализировать внутренние документы по охране труда в соответствии с новыми требованиями законодательства.",
    responsible: "Сидоров М.Д.",
    assignedBy: "Директор Петров В.И.",
    deadline: "2026-02-28",
    status: "overdue",
    priority: "high",
    comments: [
      { id: 1, author: "Сидоров М.Д.", text: "Запросил актуальные нормативы, ожидаю ответ от юридического отдела.", date: "01.03.2026" },
    ],
    section: "order",
  },
  {
    id: 3,
    number: "УК-2024-003",
    title: "Организация корпоративного обучения",
    description: "Подготовить программу обучения для новых сотрудников отдела продаж. Согласовать с HR.",
    responsible: "Козлова Е.В.",
    assignedBy: "Менеджер Новикова Т.А.",
    deadline: "2026-04-01",
    status: "new",
    priority: "medium",
    comments: [],
    section: "order",
  },
  {
    id: 4,
    number: "ОТ-2024-001",
    title: "Квартальный отчёт по продажам",
    description: "Подготовить сводный отчёт по продажам за первый квартал 2026 года с разбивкой по регионам.",
    responsible: "Морозов К.П.",
    assignedBy: "Директор Петров В.И.",
    deadline: "2026-04-10",
    status: "new",
    priority: "high",
    comments: [],
    section: "report",
  },
  {
    id: 5,
    number: "ОТ-2024-002",
    title: "Отчёт по кадровому составу",
    description: "Подготовить ежемесячный отчёт по движению кадров, текучести и укомплектованности штата.",
    responsible: "Козлова Е.В.",
    assignedBy: "HR-директор Смирнова Л.Г.",
    deadline: "2026-03-15",
    status: "done",
    priority: "medium",
    comments: [
      { id: 1, author: "Козлова Е.В.", text: "Отчёт подготовлен и направлен на согласование.", date: "08.03.2026" },
    ],
    section: "report",
  },
];

const INITIAL_EMPLOYEES: Employee[] = [
  { id: 1, name: "Иванова Анна Сергеевна", shortName: "Иванова А.С.", position: "Главный бухгалтер", department: "Финансовый отдел", email: "ivanova@corp.ru" },
  { id: 2, name: "Сидоров Михаил Дмитриевич", shortName: "Сидоров М.Д.", position: "Специалист по охране труда", department: "HR отдел", email: "sidorov@corp.ru" },
  { id: 3, name: "Козлова Екатерина Викторовна", shortName: "Козлова Е.В.", position: "HR-менеджер", department: "HR отдел", email: "kozlova@corp.ru" },
  { id: 4, name: "Морозов Кирилл Павлович", shortName: "Морозов К.П.", position: "Руководитель отдела продаж", department: "Отдел продаж", email: "morozov@corp.ru" },
  { id: 5, name: "Новикова Татьяна Александровна", shortName: "Новикова Т.А.", position: "Операционный менеджер", department: "Административный отдел", email: "novikova@corp.ru" },
];

const statusLabel: Record<Status, string> = { new: "Новое", progress: "В работе", done: "Выполнено", overdue: "Просрочено" };
const priorityLabel: Record<Priority, string> = { high: "Высокий", medium: "Средний", low: "Низкий" };
const statusClass: Record<Status, string> = { new: "status-new", progress: "status-progress", done: "status-done", overdue: "status-overdue" };
const priorityClass: Record<Priority, string> = { high: "priority-high", medium: "priority-medium", low: "priority-low" };
const priorityIcon: Record<Priority, string> = { high: "AlertTriangle", medium: "Minus", low: "ChevronDown" };

type ModalMode = "create" | "edit";

interface TaskFormState {
  title: string;
  description: string;
  responsible: string;
  deadline: string;
  priority: Priority;
  assignedBy: string;
}

const emptyForm: TaskFormState = { title: "", description: "", responsible: "", deadline: "", priority: "medium", assignedBy: "Директор Петров В.И." };

export default function Index() {
  const [section, setSection] = useState<Section>("orders");
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [employees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");

  // Task modal
  const [taskModal, setTaskModal] = useState<{ open: boolean; mode: ModalMode; editId?: number }>({ open: false, mode: "create" });
  const [taskForm, setTaskForm] = useState<TaskFormState>(emptyForm);

  // Employee panel
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [reassignModal, setReassignModal] = useState<{ open: boolean; taskId?: number }>({ open: false });
  const [reassignTo, setReassignTo] = useState("");

  const orderTasks = tasks.filter((t) => t.section === "order");
  const reportTasks = tasks.filter((t) => t.section === "report");
  const filteredOrders = filterStatus === "all" ? orderTasks : orderTasks.filter((t) => t.status === filterStatus);
  const filteredReports = filterStatus === "all" ? reportTasks : reportTasks.filter((t) => t.status === filterStatus);

  const stats = {
    total: tasks.length,
    new: tasks.filter((t) => t.status === "new").length,
    progress: tasks.filter((t) => t.status === "progress").length,
    done: tasks.filter((t) => t.status === "done").length,
    overdue: tasks.filter((t) => t.status === "overdue").length,
  };

  const employeeTasks = (emp: Employee) => tasks.filter((t) => t.responsible === emp.shortName);

  const openCreate = () => {
    setTaskForm({ ...emptyForm });
    setTaskModal({ open: true, mode: "create" });
  };

  const openEdit = (task: Task) => {
    setTaskForm({
      title: task.title,
      description: task.description,
      responsible: task.responsible,
      deadline: task.deadline,
      priority: task.priority,
      assignedBy: task.assignedBy,
    });
    setTaskModal({ open: true, mode: "edit", editId: task.id });
  };

  const saveTask = () => {
    if (!taskForm.title || !taskForm.responsible || !taskForm.deadline) return;

    if (taskModal.mode === "edit" && taskModal.editId !== undefined) {
      const updated = tasks.map((t) =>
        t.id === taskModal.editId
          ? { ...t, title: taskForm.title, description: taskForm.description, responsible: taskForm.responsible, deadline: taskForm.deadline, priority: taskForm.priority, assignedBy: taskForm.assignedBy }
          : t
      );
      setTasks(updated);
      if (selectedTask?.id === taskModal.editId) {
        setSelectedTask({ ...selectedTask, title: taskForm.title, description: taskForm.description, responsible: taskForm.responsible, deadline: taskForm.deadline, priority: taskForm.priority, assignedBy: taskForm.assignedBy });
      }
    } else {
      const task: Task = {
        id: Date.now(),
        number: `УК-2026-${String(tasks.length + 1).padStart(3, "0")}`,
        title: taskForm.title,
        description: taskForm.description,
        responsible: taskForm.responsible,
        assignedBy: taskForm.assignedBy,
        deadline: taskForm.deadline,
        status: "new",
        priority: taskForm.priority,
        comments: [],
        section: section === "reports" ? "report" : "order",
      };
      setTasks((prev) => [...prev, task]);
    }
    setTaskModal({ open: false, mode: "create" });
  };

  const deleteTask = (taskId: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTask?.id === taskId) setSelectedTask(null);
  };

  const addComment = () => {
    if (!newComment.trim() || !selectedTask) return;
    const comment: Comment = { id: Date.now(), author: "Вы", text: newComment.trim(), date: new Date().toLocaleDateString("ru-RU") };
    const updated = tasks.map((t) => t.id === selectedTask.id ? { ...t, comments: [...t.comments, comment] } : t);
    setTasks(updated);
    setSelectedTask({ ...selectedTask, comments: [...selectedTask.comments, comment] });
    setNewComment("");
  };

  const changeStatus = (taskId: number, status: Status) => {
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, status } : t));
    setTasks(updated);
    if (selectedTask?.id === taskId) setSelectedTask({ ...selectedTask, status });
  };

  const openReassign = (taskId: number) => {
    setReassignTo("");
    setReassignModal({ open: true, taskId });
  };

  const confirmReassign = () => {
    if (!reassignTo || !reassignModal.taskId) return;
    const updated = tasks.map((t) => t.id === reassignModal.taskId ? { ...t, responsible: reassignTo } : t);
    setTasks(updated);
    setReassignModal({ open: false });
  };

  const isOverdue = (deadline: string) => new Date(deadline) < new Date();

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(220,25%,97%)] font-ibm">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-[hsl(221,45%,15%)] flex flex-col">
        <div className="px-5 py-5 border-b border-[hsl(221,40%,22%)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-[hsl(42,80%,50%)] flex items-center justify-center">
              <Icon name="Building2" size={16} className="text-[hsl(221,45%,10%)]" />
            </div>
            <div>
              <div className="text-white font-semibold text-sm leading-tight">КорпусКонтроль</div>
              <div className="text-[hsl(210,30%,60%)] text-xs">Система управления</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <div className="text-[hsl(210,30%,50%)] text-xs font-medium uppercase tracking-wider px-4 pb-2">Разделы</div>
          {([["orders", "FileText", "Указания и приказы"], ["employees", "Users", "Сотрудники"], ["reports", "BarChart3", "Отчётный материал"]] as const).map(([key, icon, label]) => (
            <button key={key} onClick={() => { setSection(key); setSelectedTask(null); setSelectedEmployee(null); }} className={`nav-item w-full text-left ${section === key ? "nav-item-active" : "nav-item-inactive"}`}>
              <Icon name={icon} size={16} />
              {label}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-[hsl(221,40%,22%)]">
          <div className="nav-item nav-item-inactive">
            <Icon name="Settings" size={16} />
            Настройки
          </div>
          <div className="nav-item nav-item-inactive">
            <div className="w-6 h-6 rounded-full bg-[hsl(42,80%,50%)] flex items-center justify-center text-xs font-bold text-[hsl(221,45%,10%)]">П</div>
            Петров В.И.
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-[hsl(220,20%,87%)] px-8 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-semibold text-[hsl(220,30%,12%)]">
              {section === "orders" && "Указания и приказы"}
              {section === "employees" && "Сотрудники"}
              {section === "reports" && "Отчётный материал"}
            </h1>
            <p className="text-sm text-[hsl(220,15%,50%)] mt-0.5">
              {section === "orders" && `Всего документов: ${orderTasks.length}`}
              {section === "employees" && `Всего сотрудников: ${employees.length}`}
              {section === "reports" && `Всего отчётов: ${reportTasks.length}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {(section === "orders" || section === "reports") && (
              <>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as Status | "all")} className="text-sm border border-[hsl(220,20%,87%)] rounded-sm px-3 py-2 bg-white text-[hsl(220,30%,12%)] focus:outline-none focus:ring-1 focus:ring-[hsl(221,45%,18%)]">
                  <option value="all">Все статусы</option>
                  <option value="new">Новые</option>
                  <option value="progress">В работе</option>
                  <option value="done">Выполненные</option>
                  <option value="overdue">Просроченные</option>
                </select>
                <button onClick={openCreate} className="btn-gold flex items-center gap-2">
                  <Icon name="Plus" size={15} />
                  Создать
                </button>
              </>
            )}
          </div>
        </header>

        {/* Stats bar */}
        {(section === "orders" || section === "reports") && (
          <div className="bg-white border-b border-[hsl(220,20%,87%)] px-8 py-3 flex gap-6 flex-shrink-0">
            {[
              { label: "Всего", value: stats.total, color: "text-[hsl(220,30%,12%)]" },
              { label: "Новых", value: stats.new, color: "text-blue-600" },
              { label: "В работе", value: stats.progress, color: "text-amber-600" },
              { label: "Выполнено", value: stats.done, color: "text-green-600" },
              { label: "Просрочено", value: stats.overdue, color: "text-red-600" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className={`text-lg font-semibold font-mono-ibm ${s.color}`}>{s.value}</span>
                <span className="text-sm text-[hsl(220,15%,50%)]">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left panel */}
          <div className={`${(selectedTask || selectedEmployee) ? "w-2/5" : "w-full"} overflow-y-auto transition-all duration-300`}>

            {/* ORDERS */}
            {section === "orders" && (
              <div className="p-6 space-y-3 animate-fade-in">
                {filteredOrders.length === 0 && <EmptyState />}
                {filteredOrders.map((task) => (
                  <TaskCard key={task.id} task={task} onClick={() => { setSelectedTask(task); setSelectedEmployee(null); }} isSelected={selectedTask?.id === task.id} onEdit={() => openEdit(task)} onDelete={() => deleteTask(task.id)} />
                ))}
              </div>
            )}

            {/* REPORTS */}
            {section === "reports" && (
              <div className="p-6 space-y-3 animate-fade-in">
                {filteredReports.length === 0 && <EmptyState />}
                {filteredReports.map((task) => (
                  <TaskCard key={task.id} task={task} onClick={() => { setSelectedTask(task); setSelectedEmployee(null); }} isSelected={selectedTask?.id === task.id} onEdit={() => openEdit(task)} onDelete={() => deleteTask(task.id)} />
                ))}
              </div>
            )}

            {/* EMPLOYEES */}
            {section === "employees" && (
              <div className="p-6 space-y-3 animate-fade-in">
                {employees.map((emp) => {
                  const empTasks = employeeTasks(emp);
                  const done = empTasks.filter((t) => t.status === "done").length;
                  const overdue = empTasks.filter((t) => t.status === "overdue").length;
                  return (
                    <div key={emp.id} onClick={() => { setSelectedEmployee(emp); setSelectedTask(null); }} className={`card-corp p-5 cursor-pointer transition-all duration-150 ${selectedEmployee?.id === emp.id ? "border-[hsl(221,45%,30%)] ring-1 ring-[hsl(221,45%,30%)]" : ""}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[hsl(221,45%,18%)] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {emp.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                          </div>
                          <div>
                            <div className="font-semibold text-[hsl(220,30%,12%)] text-sm">{emp.name}</div>
                            <div className="text-[hsl(220,15%,50%)] text-xs mt-0.5">{emp.position}</div>
                            <div className="text-[hsl(220,15%,60%)] text-xs">{emp.department}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-[hsl(220,15%,50%)] mb-1">Задачи</div>
                          <div className="text-sm font-semibold text-[hsl(220,30%,12%)]">{done} / {empTasks.length}</div>
                          <div className="w-20 h-1.5 bg-[hsl(220,15%,93%)] rounded-full mt-1.5 overflow-hidden">
                            <div className="h-full bg-[hsl(42,80%,50%)] rounded-full transition-all" style={{ width: empTasks.length ? `${(done / empTasks.length) * 100}%` : "0%" }} />
                          </div>
                          {overdue > 0 && <div className="text-xs text-red-500 mt-1">{overdue} просрочено</div>}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-[hsl(220,20%,93%)] flex items-center gap-1.5 text-xs text-[hsl(220,15%,55%)]">
                        <Icon name="Mail" size={12} />
                        {emp.email}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* TASK DETAIL PANEL */}
          {selectedTask && (
            <div className="flex-1 border-l border-[hsl(220,20%,87%)] bg-white overflow-y-auto animate-slide-in">
              <div className="sticky top-0 bg-white border-b border-[hsl(220,20%,87%)] px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <div className="text-xs text-[hsl(220,15%,50%)] font-mono-ibm">{selectedTask.number}</div>
                  <div className="font-semibold text-[hsl(220,30%,12%)] mt-0.5 text-sm leading-snug max-w-xs">{selectedTask.title}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => openEdit(selectedTask)} title="Редактировать" className="p-1.5 rounded-sm hover:bg-[hsl(42,80%,93%)] text-[hsl(42,70%,40%)] transition-colors">
                    <Icon name="Pencil" size={15} />
                  </button>
                  <button onClick={() => deleteTask(selectedTask.id)} title="Удалить" className="p-1.5 rounded-sm hover:bg-red-50 text-red-400 transition-colors">
                    <Icon name="Trash2" size={15} />
                  </button>
                  <button onClick={() => setSelectedTask(null)} className="p-1.5 rounded-sm hover:bg-[hsl(220,15%,93%)] text-[hsl(220,15%,50%)] transition-colors ml-1">
                    <Icon name="X" size={16} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`status-badge ${statusClass[selectedTask.status]}`}>{statusLabel[selectedTask.status]}</span>
                  <span className={`text-xs font-medium flex items-center gap-1 ${priorityClass[selectedTask.priority]}`}>
                    <Icon name={priorityIcon[selectedTask.priority]} size={12} fallback="Minus" />
                    {priorityLabel[selectedTask.priority]} приоритет
                  </span>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {(["new", "progress", "done"] as Status[]).map((s) => (
                    <button key={s} onClick={() => changeStatus(selectedTask.id, s)} className={`text-xs px-3 py-1.5 rounded-sm border transition-colors ${selectedTask.status === s ? "bg-[hsl(221,45%,18%)] text-white border-[hsl(221,45%,18%)]" : "border-[hsl(220,20%,87%)] text-[hsl(220,15%,50%)] hover:border-[hsl(221,45%,30%)]"}`}>
                      {statusLabel[s]}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-0">
                  <InfoRow icon="User" label="Ответственный" value={selectedTask.responsible} />
                  <InfoRow icon="UserCheck" label="Назначил" value={selectedTask.assignedBy} />
                  <InfoRow icon="Calendar" label="Срок исполнения" value={new Date(selectedTask.deadline).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })} valueClass={isOverdue(selectedTask.deadline) && selectedTask.status !== "done" ? "text-red-600 font-medium" : ""} />
                </div>

                <div>
                  <div className="text-xs font-medium text-[hsl(220,15%,50%)] uppercase tracking-wider mb-2">Описание</div>
                  <div className="text-sm text-[hsl(220,30%,20%)] leading-relaxed bg-[hsl(220,15%,97%)] rounded-sm p-3">{selectedTask.description || <span className="italic text-[hsl(220,15%,60%)]">Не указано</span>}</div>
                </div>

                <div>
                  <div className="text-xs font-medium text-[hsl(220,15%,50%)] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Icon name="MessageSquare" size={12} />
                    Комментарии ({selectedTask.comments.length})
                  </div>
                  <div className="space-y-3">
                    {selectedTask.comments.map((c) => (
                      <div key={c.id} className="bg-[hsl(220,25%,97%)] rounded-sm p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-[hsl(220,30%,20%)]">{c.author}</span>
                          <span className="text-xs text-[hsl(220,15%,55%)]">{c.date}</span>
                        </div>
                        <p className="text-sm text-[hsl(220,20%,30%)] leading-relaxed">{c.text}</p>
                      </div>
                    ))}
                    {selectedTask.comments.length === 0 && <p className="text-xs text-[hsl(220,15%,60%)] italic">Комментариев пока нет</p>}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addComment()} placeholder="Добавить комментарий..." className="flex-1 text-sm border border-[hsl(220,20%,87%)] rounded-sm px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[hsl(221,45%,18%)] placeholder:text-[hsl(220,15%,65%)]" />
                    <button onClick={addComment} className="btn-primary flex items-center gap-1.5">
                      <Icon name="Send" size={13} />
                      Отправить
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EMPLOYEE DETAIL PANEL */}
          {selectedEmployee && section === "employees" && (
            <div className="flex-1 border-l border-[hsl(220,20%,87%)] bg-white overflow-y-auto animate-slide-in">
              <div className="sticky top-0 bg-white border-b border-[hsl(220,20%,87%)] px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[hsl(221,45%,18%)] flex items-center justify-center text-white font-semibold text-sm">
                    {selectedEmployee.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <div className="font-semibold text-[hsl(220,30%,12%)] text-sm">{selectedEmployee.name}</div>
                    <div className="text-xs text-[hsl(220,15%,50%)]">{selectedEmployee.position}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedEmployee(null)} className="p-1.5 rounded-sm hover:bg-[hsl(220,15%,93%)] text-[hsl(220,15%,50%)]">
                  <Icon name="X" size={16} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 gap-0">
                  <InfoRow icon="Briefcase" label="Должность" value={selectedEmployee.position} />
                  <InfoRow icon="Building" label="Отдел" value={selectedEmployee.department} />
                  <InfoRow icon="Mail" label="Email" value={selectedEmployee.email} />
                </div>

                <div>
                  <div className="text-xs font-medium text-[hsl(220,15%,50%)] uppercase tracking-wider mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2"><Icon name="ClipboardList" size={12} />Задачи сотрудника ({employeeTasks(selectedEmployee).length})</span>
                  </div>

                  {employeeTasks(selectedEmployee).length === 0 && (
                    <div className="text-center py-8 text-[hsl(220,15%,55%)]">
                      <Icon name="Inbox" size={28} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Нет активных задач</p>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {employeeTasks(selectedEmployee).map((task) => (
                      <div key={task.id} className="border border-[hsl(220,20%,87%)] rounded-sm p-3.5 bg-[hsl(220,25%,98%)]">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-[hsl(220,15%,55%)] font-mono-ibm">{task.number}</span>
                              <span className={`status-badge ${statusClass[task.status]}`}>{statusLabel[task.status]}</span>
                            </div>
                            <div className="text-sm font-medium text-[hsl(220,30%,12%)] leading-snug">{task.title}</div>
                            <div className={`text-xs mt-1.5 flex items-center gap-1 ${isOverdue(task.deadline) && task.status !== "done" ? "text-red-500" : "text-[hsl(220,15%,55%)]"}`}>
                              <Icon name="Calendar" size={11} />
                              {new Date(task.deadline).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
                            </div>
                          </div>
                          <button onClick={() => openReassign(task.id)} title="Перераспределить задачу" className="flex-shrink-0 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-sm border border-[hsl(220,20%,87%)] text-[hsl(220,15%,45%)] hover:border-[hsl(42,80%,50%)] hover:text-[hsl(42,60%,35%)] hover:bg-[hsl(42,80%,96%)] transition-all">
                            <Icon name="ArrowRightLeft" size={12} />
                            Передать
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* TASK MODAL (Create / Edit) */}
      {taskModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-lg mx-4 animate-fade-in">
            <div className="px-6 py-5 border-b border-[hsl(220,20%,87%)] flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-[hsl(220,30%,12%)]">{taskModal.mode === "edit" ? "Редактировать указание" : "Новое указание"}</h2>
                <p className="text-xs text-[hsl(220,15%,50%)] mt-0.5">{taskModal.mode === "edit" ? "Внесите изменения и сохраните" : "Заполните информацию о задаче"}</p>
              </div>
              <button onClick={() => setTaskModal({ open: false, mode: "create" })} className="p-1.5 rounded-sm hover:bg-[hsl(220,15%,93%)] text-[hsl(220,15%,50%)]">
                <Icon name="X" size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-xs font-medium text-[hsl(220,15%,40%)] block mb-1.5">Заголовок *</label>
                <input type="text" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Введите название..." className="w-full text-sm border border-[hsl(220,20%,87%)] rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[hsl(221,45%,18%)]" />
              </div>

              <div>
                <label className="text-xs font-medium text-[hsl(220,15%,40%)] block mb-1.5">Описание</label>
                <textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Подробное описание..." rows={3} className="w-full text-sm border border-[hsl(220,20%,87%)] rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[hsl(221,45%,18%)] resize-none" />
              </div>

              <div>
                <label className="text-xs font-medium text-[hsl(220,15%,40%)] block mb-1.5">Назначил</label>
                <input type="text" value={taskForm.assignedBy} onChange={(e) => setTaskForm({ ...taskForm, assignedBy: e.target.value })} placeholder="Кто назначает задачу..." className="w-full text-sm border border-[hsl(220,20%,87%)] rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[hsl(221,45%,18%)]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[hsl(220,15%,40%)] block mb-1.5">Ответственный *</label>
                  <select value={taskForm.responsible} onChange={(e) => setTaskForm({ ...taskForm, responsible: e.target.value })} className="w-full text-sm border border-[hsl(220,20%,87%)] rounded-sm px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[hsl(221,45%,18%)]">
                    <option value="">Выбрать...</option>
                    {INITIAL_EMPLOYEES.map((e) => (
                      <option key={e.id} value={e.shortName}>{e.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[hsl(220,15%,40%)] block mb-1.5">Приоритет</label>
                  <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as Priority })} className="w-full text-sm border border-[hsl(220,20%,87%)] rounded-sm px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[hsl(221,45%,18%)]">
                    <option value="high">Высокий</option>
                    <option value="medium">Средний</option>
                    <option value="low">Низкий</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[hsl(220,15%,40%)] block mb-1.5">Срок исполнения *</label>
                <input type="date" value={taskForm.deadline} onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })} className="w-full text-sm border border-[hsl(220,20%,87%)] rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[hsl(221,45%,18%)]" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[hsl(220,20%,87%)] flex justify-end gap-2">
              <button onClick={() => setTaskModal({ open: false, mode: "create" })} className="btn-ghost">Отмена</button>
              <button onClick={saveTask} className="btn-gold flex items-center gap-2">
                <Icon name={taskModal.mode === "edit" ? "Save" : "Plus"} size={14} />
                {taskModal.mode === "edit" ? "Сохранить" : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REASSIGN MODAL */}
      {reassignModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-sm mx-4 animate-fade-in">
            <div className="px-6 py-5 border-b border-[hsl(220,20%,87%)] flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-[hsl(220,30%,12%)]">Передать задачу</h2>
                <p className="text-xs text-[hsl(220,15%,50%)] mt-0.5">Выберите нового ответственного</p>
              </div>
              <button onClick={() => setReassignModal({ open: false })} className="p-1.5 rounded-sm hover:bg-[hsl(220,15%,93%)] text-[hsl(220,15%,50%)]">
                <Icon name="X" size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-2">
              {INITIAL_EMPLOYEES.map((emp) => (
                <label key={emp.id} className={`flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-all ${reassignTo === emp.shortName ? "border-[hsl(221,45%,30%)] bg-[hsl(221,45%,97%)]" : "border-[hsl(220,20%,87%)] hover:border-[hsl(220,20%,75%)]"}`}>
                  <input type="radio" name="reassign" value={emp.shortName} checked={reassignTo === emp.shortName} onChange={() => setReassignTo(emp.shortName)} className="accent-[hsl(221,45%,18%)]" />
                  <div className="w-7 h-7 rounded-full bg-[hsl(221,45%,18%)] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {emp.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[hsl(220,30%,12%)]">{emp.name}</div>
                    <div className="text-xs text-[hsl(220,15%,50%)]">{emp.position}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-[hsl(220,20%,87%)] flex justify-end gap-2">
              <button onClick={() => setReassignModal({ open: false })} className="btn-ghost">Отмена</button>
              <button onClick={confirmReassign} disabled={!reassignTo} className="btn-gold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                <Icon name="ArrowRightLeft" size={14} />
                Передать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onClick, isSelected, onEdit, onDelete }: { task: Task; onClick: () => void; isSelected: boolean; onEdit: () => void; onDelete: () => void }) {
  const overdue = new Date(task.deadline) < new Date() && task.status !== "done";
  return (
    <div onClick={onClick} className={`card-corp p-4 cursor-pointer transition-all duration-150 group ${isSelected ? "border-[hsl(221,45%,30%)] ring-1 ring-[hsl(221,45%,30%)]" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs text-[hsl(220,15%,55%)] font-mono-ibm">{task.number}</span>
            <span className={`status-badge ${statusClass[task.status]}`}>{statusLabel[task.status]}</span>
          </div>
          <div className="font-medium text-sm text-[hsl(220,30%,12%)] leading-snug line-clamp-2">{task.title}</div>
          <div className="flex items-center gap-3 mt-2 text-xs text-[hsl(220,15%,55%)]">
            <span className="flex items-center gap-1"><Icon name="User" size={11} />{task.responsible}</span>
            <span className={`flex items-center gap-1 ${overdue ? "text-red-600 font-medium" : ""}`}>
              <Icon name="Calendar" size={11} />
              {new Date(task.deadline).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
            </span>
            {task.comments.length > 0 && <span className="flex items-center gap-1"><Icon name="MessageSquare" size={11} />{task.comments.length}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`text-xs ${priorityClass[task.priority]}`}>
            <Icon name={task.priority === "high" ? "AlertTriangle" : task.priority === "medium" ? "Minus" : "ChevronDown"} size={14} fallback="Minus" />
          </span>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1 rounded-sm hover:bg-[hsl(42,80%,93%)] text-[hsl(42,60%,40%)] transition-colors" title="Редактировать">
              <Icon name="Pencil" size={12} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 rounded-sm hover:bg-red-50 text-red-400 transition-colors" title="Удалить">
              <Icon name="Trash2" size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, valueClass = "" }: { icon: string; label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-[hsl(220,20%,93%)] last:border-0">
      <div className="w-6 flex-shrink-0 flex items-center justify-center">
        <Icon name={icon} size={13} className="text-[hsl(220,15%,55%)]" fallback="Info" />
      </div>
      <div className="text-xs text-[hsl(220,15%,50%)] w-28 flex-shrink-0">{label}</div>
      <div className={`text-sm text-[hsl(220,30%,15%)] font-medium ${valueClass}`}>{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 text-[hsl(220,15%,50%)]">
      <Icon name="Inbox" size={40} className="mx-auto mb-3 opacity-30" />
      <p>Нет документов по выбранному фильтру</p>
    </div>
  );
}
