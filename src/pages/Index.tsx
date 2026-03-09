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
  position: string;
  department: string;
  tasks: number;
  completed: number;
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
  { id: 1, name: "Иванова Анна Сергеевна", position: "Главный бухгалтер", department: "Финансовый отдел", tasks: 4, completed: 2, email: "ivanova@corp.ru" },
  { id: 2, name: "Сидоров Михаил Дмитриевич", position: "Специалист по охране труда", department: "HR отдел", tasks: 3, completed: 1, email: "sidorov@corp.ru" },
  { id: 3, name: "Козлова Екатерина Викторовна", position: "HR-менеджер", department: "HR отдел", tasks: 5, completed: 3, email: "kozlova@corp.ru" },
  { id: 4, name: "Морозов Кирилл Павлович", position: "Руководитель отдела продаж", department: "Отдел продаж", tasks: 6, completed: 5, email: "morozov@corp.ru" },
  { id: 5, name: "Новикова Татьяна Александровна", position: "Операционный менеджер", department: "Административный отдел", tasks: 2, completed: 2, email: "novikova@corp.ru" },
];

const statusLabel: Record<Status, string> = {
  new: "Новое",
  progress: "В работе",
  done: "Выполнено",
  overdue: "Просрочено",
};

const priorityLabel: Record<Priority, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

const statusClass: Record<Status, string> = {
  new: "status-new",
  progress: "status-progress",
  done: "status-done",
  overdue: "status-overdue",
};

const priorityClass: Record<Priority, string> = {
  high: "priority-high",
  medium: "priority-medium",
  low: "priority-low",
};

const priorityIcon: Record<Priority, string> = {
  high: "AlertTriangle",
  medium: "Minus",
  low: "ChevronDown",
};

export default function Index() {
  const [section, setSection] = useState<Section>("orders");
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [employees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState("");
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    responsible: "",
    deadline: "",
    priority: "medium" as Priority,
  });

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

  const addComment = () => {
    if (!newComment.trim() || !selectedTask) return;
    const comment: Comment = {
      id: Date.now(),
      author: "Вы",
      text: newComment.trim(),
      date: new Date().toLocaleDateString("ru-RU"),
    };
    const updated = tasks.map((t) =>
      t.id === selectedTask.id ? { ...t, comments: [...t.comments, comment] } : t
    );
    setTasks(updated);
    setSelectedTask({ ...selectedTask, comments: [...selectedTask.comments, comment] });
    setNewComment("");
  };

  const changeStatus = (taskId: number, status: Status) => {
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, status } : t));
    setTasks(updated);
    if (selectedTask?.id === taskId) setSelectedTask({ ...selectedTask, status });
  };

  const createTask = () => {
    if (!newTask.title || !newTask.responsible || !newTask.deadline) return;
    const task: Task = {
      id: Date.now(),
      number: `УК-2024-${String(tasks.length + 1).padStart(3, "0")}`,
      title: newTask.title,
      description: newTask.description,
      responsible: newTask.responsible,
      assignedBy: "Вы",
      deadline: newTask.deadline,
      status: "new",
      priority: newTask.priority,
      comments: [],
      section: section === "reports" ? "report" : "order",
    };
    setTasks([...tasks, task]);
    setNewTask({ title: "", description: "", responsible: "", deadline: "", priority: "medium" });
    setShowNewTaskModal(false);
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
          <button onClick={() => setSection("orders")} className={`nav-item w-full text-left ${section === "orders" ? "nav-item-active" : "nav-item-inactive"}`}>
            <Icon name="FileText" size={16} />
            Указания и приказы
          </button>
          <button onClick={() => setSection("employees")} className={`nav-item w-full text-left ${section === "employees" ? "nav-item-active" : "nav-item-inactive"}`}>
            <Icon name="Users" size={16} />
            Сотрудники
          </button>
          <button onClick={() => setSection("reports")} className={`nav-item w-full text-left ${section === "reports" ? "nav-item-active" : "nav-item-inactive"}`}>
            <Icon name="BarChart3" size={16} />
            Отчётный материал
          </button>
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
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as Status | "all")}
                  className="text-sm border border-[hsl(220,20%,87%)] rounded-sm px-3 py-2 bg-white text-[hsl(220,30%,12%)] focus:outline-none focus:ring-1 focus:ring-[hsl(221,45%,18%)]"
                >
                  <option value="all">Все статусы</option>
                  <option value="new">Новые</option>
                  <option value="progress">В работе</option>
                  <option value="done">Выполненные</option>
                  <option value="overdue">Просроченные</option>
                </select>
                <button onClick={() => setShowNewTaskModal(true)} className="btn-gold flex items-center gap-2">
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
          {/* Task list */}
          <div className={`${selectedTask ? "w-2/5" : "w-full"} overflow-y-auto transition-all duration-300`}>
            {section === "orders" && (
              <div className="p-6 space-y-3 animate-fade-in">
                {filteredOrders.length === 0 && (
                  <div className="text-center py-16 text-[hsl(220,15%,50%)]">
                    <Icon name="Inbox" size={40} className="mx-auto mb-3 opacity-30" />
                    <p>Нет документов по выбранному фильтру</p>
                  </div>
                )}
                {filteredOrders.map((task) => (
                  <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} isSelected={selectedTask?.id === task.id} />
                ))}
              </div>
            )}
            {section === "reports" && (
              <div className="p-6 space-y-3 animate-fade-in">
                {filteredReports.length === 0 && (
                  <div className="text-center py-16 text-[hsl(220,15%,50%)]">
                    <Icon name="Inbox" size={40} className="mx-auto mb-3 opacity-30" />
                    <p>Нет отчётов по выбранному фильтру</p>
                  </div>
                )}
                {filteredReports.map((task) => (
                  <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} isSelected={selectedTask?.id === task.id} />
                ))}
              </div>
            )}
            {section === "employees" && (
              <div className="p-6 space-y-3 animate-fade-in">
                {employees.map((emp) => (
                  <div key={emp.id} className="card-corp p-5 cursor-pointer hover:border-[hsl(221,45%,30%)] transition-all">
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
                        <div className="text-sm font-semibold text-[hsl(220,30%,12%)]">
                          {emp.completed} / {emp.tasks}
                        </div>
                        <div className="w-20 h-1.5 bg-[hsl(220,15%,93%)] rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="h-full bg-[hsl(42,80%,50%)] rounded-full"
                            style={{ width: `${(emp.completed / emp.tasks) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[hsl(220,20%,93%)] flex items-center gap-1.5 text-xs text-[hsl(220,15%,55%)]">
                      <Icon name="Mail" size={12} />
                      {emp.email}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Task Detail Panel */}
          {selectedTask && (
            <div className="flex-1 border-l border-[hsl(220,20%,87%)] bg-white overflow-y-auto animate-slide-in">
              <div className="sticky top-0 bg-white border-b border-[hsl(220,20%,87%)] px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <div className="text-xs text-[hsl(220,15%,50%)] font-mono-ibm">{selectedTask.number}</div>
                  <div className="font-semibold text-[hsl(220,30%,12%)] mt-0.5 text-sm leading-snug max-w-xs">{selectedTask.title}</div>
                </div>
                <button onClick={() => setSelectedTask(null)} className="p-1.5 rounded-sm hover:bg-[hsl(220,15%,93%)] text-[hsl(220,15%,50%)] transition-colors">
                  <Icon name="X" size={16} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Status control */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`status-badge ${statusClass[selectedTask.status]}`}>
                    {statusLabel[selectedTask.status]}
                  </span>
                  <span className={`text-xs font-medium flex items-center gap-1 ${priorityClass[selectedTask.priority]}`}>
                    <Icon name={priorityIcon[selectedTask.priority]} size={12} fallback="Minus" />
                    {priorityLabel[selectedTask.priority]} приоритет
                  </span>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {(["new", "progress", "done"] as Status[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => changeStatus(selectedTask.id, s)}
                      className={`text-xs px-3 py-1.5 rounded-sm border transition-colors ${
                        selectedTask.status === s
                          ? "bg-[hsl(221,45%,18%)] text-white border-[hsl(221,45%,18%)]"
                          : "border-[hsl(220,20%,87%)] text-[hsl(220,15%,50%)] hover:border-[hsl(221,45%,30%)]"
                      }`}
                    >
                      {statusLabel[s]}
                    </button>
                  ))}
                </div>

                {/* Meta */}
                <div className="grid grid-cols-1 gap-3">
                  <InfoRow icon="User" label="Ответственный" value={selectedTask.responsible} />
                  <InfoRow icon="UserCheck" label="Назначил" value={selectedTask.assignedBy} />
                  <InfoRow
                    icon="Calendar"
                    label="Срок исполнения"
                    value={new Date(selectedTask.deadline).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                    valueClass={isOverdue(selectedTask.deadline) && selectedTask.status !== "done" ? "text-red-600 font-medium" : ""}
                  />
                </div>

                {/* Description */}
                <div>
                  <div className="text-xs font-medium text-[hsl(220,15%,50%)] uppercase tracking-wider mb-2">Описание</div>
                  <div className="text-sm text-[hsl(220,30%,20%)] leading-relaxed bg-[hsl(220,15%,97%)] rounded-sm p-3">
                    {selectedTask.description}
                  </div>
                </div>

                {/* Comments */}
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
                    {selectedTask.comments.length === 0 && (
                      <p className="text-xs text-[hsl(220,15%,60%)] italic">Комментариев пока нет</p>
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addComment()}
                      placeholder="Добавить комментарий..."
                      className="flex-1 text-sm border border-[hsl(220,20%,87%)] rounded-sm px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[hsl(221,45%,18%)] placeholder:text-[hsl(220,15%,65%)]"
                    />
                    <button onClick={addComment} className="btn-primary flex items-center gap-1.5">
                      <Icon name="Send" size={13} />
                      Отправить
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-lg mx-4 animate-fade-in">
            <div className="px-6 py-5 border-b border-[hsl(220,20%,87%)] flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-[hsl(220,30%,12%)]">Новое указание</h2>
                <p className="text-xs text-[hsl(220,15%,50%)] mt-0.5">Заполните информацию о задаче</p>
              </div>
              <button onClick={() => setShowNewTaskModal(false)} className="p-1.5 rounded-sm hover:bg-[hsl(220,15%,93%)] text-[hsl(220,15%,50%)]">
                <Icon name="X" size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-[hsl(220,15%,40%)] block mb-1.5">Заголовок *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Введите название задачи..."
                  className="w-full text-sm border border-[hsl(220,20%,87%)] rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[hsl(221,45%,18%)]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[hsl(220,15%,40%)] block mb-1.5">Описание</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Подробное описание задачи..."
                  rows={3}
                  className="w-full text-sm border border-[hsl(220,20%,87%)] rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[hsl(221,45%,18%)] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[hsl(220,15%,40%)] block mb-1.5">Ответственный *</label>
                  <select
                    value={newTask.responsible}
                    onChange={(e) => setNewTask({ ...newTask, responsible: e.target.value })}
                    className="w-full text-sm border border-[hsl(220,20%,87%)] rounded-sm px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[hsl(221,45%,18%)]"
                  >
                    <option value="">Выбрать...</option>
                    {INITIAL_EMPLOYEES.map((e) => (
                      <option key={e.id} value={e.name.split(" ").slice(0, 2).join(" ").replace(/(\w+)\s(\w)(\w+)/, "$1 $2.")}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[hsl(220,15%,40%)] block mb-1.5">Приоритет</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Priority })}
                    className="w-full text-sm border border-[hsl(220,20%,87%)] rounded-sm px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[hsl(221,45%,18%)]"
                  >
                    <option value="high">Высокий</option>
                    <option value="medium">Средний</option>
                    <option value="low">Низкий</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[hsl(220,15%,40%)] block mb-1.5">Срок исполнения *</label>
                <input
                  type="date"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                  className="w-full text-sm border border-[hsl(220,20%,87%)] rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[hsl(221,45%,18%)]"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[hsl(220,20%,87%)] flex justify-end gap-2">
              <button onClick={() => setShowNewTaskModal(false)} className="btn-ghost">Отмена</button>
              <button onClick={createTask} className="btn-gold flex items-center gap-2">
                <Icon name="Plus" size={14} />
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onClick, isSelected }: { task: Task; onClick: () => void; isSelected: boolean }) {
  const isOverdue = new Date(task.deadline) < new Date() && task.status !== "done";

  return (
    <div
      onClick={onClick}
      className={`card-corp p-4 cursor-pointer transition-all duration-150 ${isSelected ? "border-[hsl(221,45%,30%)] ring-1 ring-[hsl(221,45%,30%)]" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs text-[hsl(220,15%,55%)] font-mono-ibm">{task.number}</span>
            <span className={`status-badge ${statusClass[task.status]}`}>{statusLabel[task.status]}</span>
          </div>
          <div className="font-medium text-sm text-[hsl(220,30%,12%)] leading-snug line-clamp-2">{task.title}</div>
          <div className="flex items-center gap-3 mt-2 text-xs text-[hsl(220,15%,55%)]">
            <span className="flex items-center gap-1">
              <Icon name="User" size={11} />
              {task.responsible}
            </span>
            <span className={`flex items-center gap-1 ${isOverdue ? "text-red-600 font-medium" : ""}`}>
              <Icon name="Calendar" size={11} />
              {new Date(task.deadline).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
            </span>
            {task.comments.length > 0 && (
              <span className="flex items-center gap-1">
                <Icon name="MessageSquare" size={11} />
                {task.comments.length}
              </span>
            )}
          </div>
        </div>
        <div className={`flex-shrink-0 text-xs font-medium ${priorityClass[task.priority]}`}>
          <Icon name={task.priority === "high" ? "AlertTriangle" : task.priority === "medium" ? "Minus" : "ChevronDown"} size={14} fallback="Minus" />
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
