import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { store, type Task, type Employee, type Comment, type Status, type Priority } from "@/lib/localStore";

type Section = "orders" | "employees" | "reports";



const statusLabel: Record<Status, string> = { new: "Новое", progress: "В работе", done: "Выполнено", overdue: "Просрочено" };
const priorityLabel: Record<Priority, string> = { high: "Высокий", medium: "Средний", low: "Низкий" };
const statusClass: Record<Status, string> = { new: "status-new", progress: "status-progress", done: "status-done", overdue: "status-overdue" };
const priorityClass: Record<Priority, string> = { high: "priority-high", medium: "priority-medium", low: "priority-low" };
const priorityIcon: Record<Priority, string> = { high: "AlertTriangle", medium: "Minus", low: "ChevronDown" };

type ModalMode = "create" | "edit";

interface TaskFormState {
  title: string;
  description: string;
  responsible: string[];
  deadline: string;
  priority: Priority;
  assignedBy: string;
  linkedOrderId?: number;
}

const emptyForm: TaskFormState = { title: "", description: "", responsible: [], deadline: "", priority: "medium", assignedBy: "Директор Петров В.И.", linkedOrderId: undefined };

// Avatar group for multiple responsibles
function AvatarGroup({ names, max = 3 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max);
  const rest = names.length - max;
  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((name, i) => (
        <div key={i} title={name} className="w-6 h-6 rounded-full bg-[hsl(221,45%,18%)] border-2 border-white flex items-center justify-center text-white text-[9px] font-semibold flex-shrink-0">
          {name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
        </div>
      ))}
      {rest > 0 && (
        <div className="w-6 h-6 rounded-full bg-[hsl(220,15%,75%)] border-2 border-white flex items-center justify-center text-white text-[9px] font-semibold flex-shrink-0">
          +{rest}
        </div>
      )}
    </div>
  );
}

export default function Index() {
  const [section, setSection] = useState<Section>("orders");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskComments, setTaskComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");

  const [taskModal, setTaskModal] = useState<{ open: boolean; mode: ModalMode; editId?: number }>({ open: false, mode: "create" });
  const [taskForm, setTaskForm] = useState<TaskFormState>(emptyForm);

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [reassignModal, setReassignModal] = useState<{ open: boolean; taskId?: number }>({ open: false });
  const [reassignSelected, setReassignSelected] = useState<string[]>([]);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empModal, setEmpModal] = useState(false);
  const [deleteEmpModal, setDeleteEmpModal] = useState<Employee | null>(null);
  const [empForm, setEmpForm] = useState({ name: "", position: "", department: "", email: "" });

  const loadData = async () => {
    setLoading(true);
    const [t, e] = await Promise.all([store.getTasks(), store.getEmployees()]);
    setTasks(t);
    setEmployees(e);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

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

  const employeeTasks = (emp: Employee) => tasks.filter((t) => t.responsible.includes(emp.shortName));

  // Toggle responsible in form
  const toggleFormResponsible = (shortName: string) => {
    setTaskForm((prev) => ({
      ...prev,
      responsible: prev.responsible.includes(shortName)
        ? prev.responsible.filter((r) => r !== shortName)
        : [...prev.responsible, shortName],
    }));
  };

  const openCreate = () => {
    setTaskForm({ ...emptyForm });
    setTaskModal({ open: true, mode: "create" });
  };

  const openEdit = (task: Task) => {
    setTaskForm({
      title: task.title,
      description: task.description,
      responsible: [...task.responsible],
      deadline: task.deadline,
      priority: task.priority,
      assignedBy: task.assignedBy,
      linkedOrderId: task.linkedOrderId,
    });
    setTaskModal({ open: true, mode: "edit", editId: task.id });
  };

  const saveTask = async () => {
    if (!taskForm.title || taskForm.responsible.length === 0 || !taskForm.deadline) return;
    const isReport = section === "reports" || (taskModal.mode === "edit" && tasks.find((t) => t.id === taskModal.editId)?.section === "report");
    if (taskModal.mode === "edit" && taskModal.editId !== undefined) {
      await store.updateTask(taskModal.editId, {
        title: taskForm.title, description: taskForm.description,
        responsible: taskForm.responsible, deadline: taskForm.deadline,
        priority: taskForm.priority, assignedBy: taskForm.assignedBy,
        linkedOrderId: taskForm.linkedOrderId,
      });
    } else {
      const number = isReport
        ? `ОТ-2026-${String(reportTasks.length + 1).padStart(3, "0")}`
        : `УК-2026-${String(orderTasks.length + 1).padStart(3, "0")}`;
      await store.createTask({
        number, title: taskForm.title, description: taskForm.description,
        responsible: taskForm.responsible, assignedBy: taskForm.assignedBy,
        deadline: taskForm.deadline, priority: taskForm.priority,
        section: isReport ? "report" : "order",
        linkedOrderId: isReport ? taskForm.linkedOrderId : undefined,
      });
    }
    setTaskModal({ open: false, mode: "create" });
    if (taskModal.mode === "edit" && taskModal.editId) setSelectedTask(null);
    await loadData();
  };

  const deleteTask = async (taskId: number) => {
    await store.deleteTask(taskId);
    if (selectedTask?.id === taskId) setSelectedTask(null);
    await loadData();
  };

  const makeShortName = (fullName: string) => {
    const parts = fullName.trim().split(" ");
    if (parts.length < 2) return fullName;
    return `${parts[0]} ${parts[1][0]}.${parts[2] ? parts[2][0] + "." : ""}`;
  };

  const addEmployee = async () => {
    if (!empForm.name || !empForm.position || !empForm.department) return;
    const shortName = makeShortName(empForm.name);
    await store.createEmployee({ name: empForm.name.trim(), shortName, position: empForm.position.trim(), department: empForm.department.trim(), email: empForm.email.trim() });
    setEmpForm({ name: "", position: "", department: "", email: "" });
    setEmpModal(false);
    await loadData();
  };

  const confirmDeleteEmployee = async () => {
    if (!deleteEmpModal) return;
    await store.deleteEmployee(deleteEmpModal.id);
    if (selectedEmployee?.id === deleteEmpModal.id) setSelectedEmployee(null);
    setDeleteEmpModal(null);
    await loadData();
  };

  const addComment = async () => {
    if (!newComment.trim() || !selectedTask) return;
    const date = new Date().toLocaleDateString("ru-RU");
    await store.addComment(selectedTask.id!, "Вы", newComment.trim(), date);
    const comments = await store.getComments(selectedTask.id!);
    setTaskComments(comments);
    setNewComment("");
  };

  const changeStatus = async (taskId: number, status: Status) => {
    await store.updateTask(taskId, { status });
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, status } : t));
    setTasks(updated);
    if (selectedTask?.id === taskId) setSelectedTask({ ...selectedTask, status });
  };

  const openReassign = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId);
    setReassignSelected(task ? [...task.responsible] : []);
    setReassignModal({ open: true, taskId });
  };

  const toggleReassign = (shortName: string) => {
    setReassignSelected((prev) =>
      prev.includes(shortName) ? prev.filter((r) => r !== shortName) : [...prev, shortName]
    );
  };

  const confirmReassign = async () => {
    if (reassignSelected.length === 0 || !reassignModal.taskId) return;
    await store.updateTask(reassignModal.taskId, { responsible: reassignSelected });
    const updated = tasks.map((t) => t.id === reassignModal.taskId ? { ...t, responsible: reassignSelected } : t);
    setTasks(updated);
    if (selectedTask?.id === reassignModal.taskId) setSelectedTask({ ...selectedTask, responsible: reassignSelected });
    setReassignModal({ open: false });
  };

  const isOverdue = (deadline: string) => new Date(deadline) < new Date();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[hsl(220,25%,97%)]">
        <div className="flex flex-col items-center gap-3 text-[hsl(220,15%,50%)]">
          <Icon name="Loader2" size={32} className="animate-spin text-[hsl(221,45%,18%)]" />
          <span className="text-sm">Загрузка данных...</span>
        </div>
      </div>
    );
  }

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
          <div className="nav-item nav-item-inactive"><Icon name="Settings" size={16} />Настройки</div>
          <div className="nav-item nav-item-inactive">
            <div className="w-6 h-6 rounded-full bg-[hsl(42,80%,50%)] flex items-center justify-center text-xs font-bold text-[hsl(221,45%,10%)]">П</div>
            Петров В.И.
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
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
                  <Icon name="Plus" size={15} />Создать
                </button>
              </>
            )}
            {section === "employees" && (
              <button onClick={() => { setEmpForm({ name: "", position: "", department: "", email: "" }); setEmpModal(true); }} className="btn-gold flex items-center gap-2">
                <Icon name="UserPlus" size={15} />Добавить сотрудника
              </button>
            )}
          </div>
        </header>

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

        <div className="flex-1 overflow-hidden flex">
          {/* Left list */}
          <div className={`${(selectedTask || selectedEmployee) ? "w-2/5" : "w-full"} overflow-y-auto transition-all duration-300`}>

            {section === "orders" && (
              <div className="p-6 space-y-3 animate-fade-in">
                {filteredOrders.length === 0 && <EmptyState />}
                {filteredOrders.map((task) => (
                  <TaskCard key={task.id} task={task}
                    onClick={() => { setSelectedTask(task); setSelectedEmployee(null); store.getComments(task.id!).then(setTaskComments); }}
                    isSelected={selectedTask?.id === task.id}
                    onEdit={() => openEdit(task)}
                    onDelete={() => deleteTask(task.id)}
                  />
                ))}
              </div>
            )}

            {section === "reports" && (
              <div className="p-6 space-y-3 animate-fade-in">
                {filteredReports.length === 0 && <EmptyState />}
                {filteredReports.map((task) => (
                  <TaskCard key={task.id} task={task}
                    onClick={() => { setSelectedTask(task); setSelectedEmployee(null); store.getComments(task.id!).then(setTaskComments); }}
                    isSelected={selectedTask?.id === task.id}
                    onEdit={() => openEdit(task)}
                    onDelete={() => deleteTask(task.id)}
                    linkedOrder={task.linkedOrderId ? tasks.find((t) => t.id === task.linkedOrderId) : undefined}
                  />
                ))}
              </div>
            )}

            {section === "employees" && (
              <div className="p-6 space-y-3 animate-fade-in">
                {employees.map((emp) => {
                  const empTasks = employeeTasks(emp);
                  const done = empTasks.filter((t) => t.status === "done").length;
                  const overdue = empTasks.filter((t) => t.status === "overdue").length;
                  return (
                    <div key={emp.id} onClick={() => { setSelectedEmployee(emp); setSelectedTask(null); }}
                      className={`card-corp p-5 cursor-pointer transition-all duration-150 group ${selectedEmployee?.id === emp.id ? "border-[hsl(221,45%,30%)] ring-1 ring-[hsl(221,45%,30%)]" : ""}`}>
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
                        <div className="flex items-start gap-3">
                          <div className="text-right">
                            <div className="text-xs text-[hsl(220,15%,50%)] mb-1">Задачи</div>
                            <div className="text-sm font-semibold text-[hsl(220,30%,12%)]">{done} / {empTasks.length}</div>
                            <div className="w-20 h-1.5 bg-[hsl(220,15%,93%)] rounded-full mt-1.5 overflow-hidden">
                              <div className="h-full bg-[hsl(42,80%,50%)] rounded-full transition-all" style={{ width: empTasks.length ? `${(done / empTasks.length) * 100}%` : "0%" }} />
                            </div>
                            {overdue > 0 && <div className="text-xs text-red-500 mt-1">{overdue} просрочено</div>}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteEmpModal(emp); }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-sm hover:bg-red-50 text-red-400 flex-shrink-0 mt-0.5"
                            title="Удалить сотрудника"
                          >
                            <Icon name="Trash2" size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-[hsl(220,20%,93%)] flex items-center gap-1.5 text-xs text-[hsl(220,15%,55%)]">
                        <Icon name="Mail" size={12} />{emp.email || "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* TASK DETAIL */}
          {selectedTask && (
            <div className="flex-1 border-l border-[hsl(220,20%,87%)] bg-white overflow-y-auto animate-slide-in">
              <div className="sticky top-0 bg-white border-b border-[hsl(220,20%,87%)] px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <div className="text-xs text-[hsl(220,15%,50%)] font-mono-ibm">{selectedTask.number}</div>
                  <div className="font-semibold text-[hsl(220,30%,12%)] mt-0.5 text-sm leading-snug max-w-xs">{selectedTask.title}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => openEdit(selectedTask)} className="p-1.5 rounded-sm hover:bg-[hsl(42,80%,93%)] text-[hsl(42,70%,40%)] transition-colors" title="Редактировать">
                    <Icon name="Pencil" size={15} />
                  </button>
                  <button onClick={() => openReassign(selectedTask.id)} className="p-1.5 rounded-sm hover:bg-blue-50 text-blue-400 transition-colors" title="Перераспределить">
                    <Icon name="ArrowRightLeft" size={15} />
                  </button>
                  <button onClick={() => deleteTask(selectedTask.id)} className="p-1.5 rounded-sm hover:bg-red-50 text-red-400 transition-colors" title="Удалить">
                    <Icon name="Trash2" size={15} />
                  </button>
                  <button onClick={() => setSelectedTask(null)} className="p-1.5 rounded-sm hover:bg-[hsl(220,15%,93%)] text-[hsl(220,15%,50%)] ml-1">
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
                    <button key={s} onClick={() => changeStatus(selectedTask.id, s)}
                      className={`text-xs px-3 py-1.5 rounded-sm border transition-colors ${selectedTask.status === s ? "bg-[hsl(221,45%,18%)] text-white border-[hsl(221,45%,18%)]" : "border-[hsl(220,20%,87%)] text-[hsl(220,15%,50%)] hover:border-[hsl(221,45%,30%)]"}`}>
                      {statusLabel[s]}
                    </button>
                  ))}
                </div>

                {/* Responsible */}
                <div>
                  <div className="text-xs font-medium text-[hsl(220,15%,50%)] uppercase tracking-wider mb-2.5 flex items-center gap-2">
                    <Icon name="Users" size={12} />
                    Ответственные ({selectedTask.responsible.length})
                  </div>
                  <div className="space-y-2">
                    {selectedTask.responsible.map((name) => {
                      const emp = employees.find((e) => e.shortName === name);
                      return (
                        <div key={name} className="flex items-center gap-2.5 py-1.5">
                          <div className="w-7 h-7 rounded-full bg-[hsl(221,45%,18%)] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-[hsl(220,30%,12%)]">{name}</div>
                            {emp && <div className="text-xs text-[hsl(220,15%,55%)]">{emp.position}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={() => openReassign(selectedTask.id)} className="mt-2 text-xs flex items-center gap-1.5 text-[hsl(221,45%,40%)] hover:text-[hsl(221,45%,25%)] transition-colors">
                    <Icon name="ArrowRightLeft" size={12} />
                    Изменить состав исполнителей
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-0">
                  <InfoRow icon="UserCheck" label="Назначил" value={selectedTask.assignedBy} />
                  <InfoRow icon="Calendar" label="Срок исполнения"
                    value={new Date(selectedTask.deadline).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                    valueClass={isOverdue(selectedTask.deadline) && selectedTask.status !== "done" ? "text-red-600 font-medium" : ""}
                  />
                </div>

                {selectedTask.section === "report" && (() => {
                  const linkedOrder = selectedTask.linkedOrderId ? tasks.find((t) => t.id === selectedTask.linkedOrderId) : null;
                  return (
                    <div>
                      <div className="text-xs font-medium text-[hsl(220,15%,50%)] uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Icon name="Link" size={12} />
                        Связанное указание
                      </div>
                      {linkedOrder ? (
                        <div className="flex items-start gap-3 bg-[hsl(221,45%,97%)] border border-[hsl(221,45%,85%)] rounded-sm p-3">
                          <Icon name="FileText" size={14} className="text-[hsl(221,45%,40%)] mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-mono text-[hsl(221,45%,40%)]">{linkedOrder.number}</div>
                            <div className="text-sm font-medium text-[hsl(220,30%,12%)] mt-0.5 leading-snug">{linkedOrder.title}</div>
                            <span className={`status-badge ${statusClass[linkedOrder.status]} mt-1 inline-flex`}>{statusLabel[linkedOrder.status]}</span>
                          </div>
                          <button
                            onClick={() => { setSelectedTask(linkedOrder); store.getComments(linkedOrder.id!).then(setTaskComments); }}
                            className="text-xs text-[hsl(221,45%,40%)] hover:text-[hsl(221,45%,20%)] flex items-center gap-1 flex-shrink-0 transition-colors"
                          >
                            Открыть <Icon name="ArrowRight" size={11} />
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm text-[hsl(220,15%,55%)] italic bg-[hsl(220,15%,97%)] rounded-sm p-3">Указание не привязано</div>
                      )}
                    </div>
                  );
                })()}

                <div>
                  <div className="text-xs font-medium text-[hsl(220,15%,50%)] uppercase tracking-wider mb-2">Описание</div>
                  <div className="text-sm text-[hsl(220,30%,20%)] leading-relaxed bg-[hsl(220,15%,97%)] rounded-sm p-3">
                    {selectedTask.description || <span className="italic text-[hsl(220,15%,60%)]">Не указано</span>}
                  </div>
                </div>

                {selectedTask.section === "order" && (() => {
                  const linkedReports = tasks.filter((t) => t.section === "report" && t.linkedOrderId === selectedTask.id);
                  return (
                    <div>
                      <div className="text-xs font-medium text-[hsl(220,15%,50%)] uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Icon name="BarChart3" size={12} />
                        Отчётные материалы ({linkedReports.length})
                      </div>
                      {linkedReports.length > 0 ? (
                        <div className="space-y-2">
                          {linkedReports.map((r) => (
                            <div key={r.id} className="flex items-center gap-3 bg-[hsl(220,15%,97%)] border border-[hsl(220,20%,90%)] rounded-sm p-2.5">
                              <Icon name="FileBarChart" size={13} className="text-[hsl(220,15%,50%)] flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-mono text-[hsl(220,15%,50%)]">{r.number}</div>
                                <div className="text-sm font-medium text-[hsl(220,30%,12%)] leading-snug truncate">{r.title}</div>
                              </div>
                              <span className={`status-badge ${statusClass[r.status]} flex-shrink-0`}>{statusLabel[r.status]}</span>
                              <button
                                onClick={() => { setSelectedTask(r); store.getComments(r.id!).then(setTaskComments); }}
                                className="text-xs text-[hsl(221,45%,40%)] hover:text-[hsl(221,45%,20%)] flex-shrink-0 transition-colors"
                              >
                                <Icon name="ArrowRight" size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-[hsl(220,15%,55%)] italic bg-[hsl(220,15%,97%)] rounded-sm p-3">Отчётов по этому указанию нет</div>
                      )}
                    </div>
                  );
                })()}

                <div>
                  <div className="text-xs font-medium text-[hsl(220,15%,50%)] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Icon name="MessageSquare" size={12} />
                    Комментарии ({taskComments.length})
                  </div>
                  <div className="space-y-3">
                    {taskComments.map((c) => (
                      <div key={c.id} className="bg-[hsl(220,25%,97%)] rounded-sm p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-[hsl(220,30%,20%)]">{c.author}</span>
                          <span className="text-xs text-[hsl(220,15%,55%)]">{c.date}</span>
                        </div>
                        <p className="text-sm text-[hsl(220,20%,30%)] leading-relaxed">{c.text}</p>
                      </div>
                    ))}
                    {taskComments.length === 0 && <p className="text-xs text-[hsl(220,15%,60%)] italic">Комментариев пока нет</p>}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addComment()}
                      placeholder="Добавить комментарий..." className="flex-1 text-sm border border-[hsl(220,20%,87%)] rounded-sm px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[hsl(221,45%,18%)] placeholder:text-[hsl(220,15%,65%)]" />
                    <button onClick={addComment} className="btn-primary flex items-center gap-1.5">
                      <Icon name="Send" size={13} />Отправить
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EMPLOYEE DETAIL */}
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
                  <div className="text-xs font-medium text-[hsl(220,15%,50%)] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Icon name="ClipboardList" size={12} />
                    Задачи сотрудника ({employeeTasks(selectedEmployee).length})
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
                            {task.responsible.length > 1 && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <AvatarGroup names={task.responsible} />
                                <span className="text-xs text-[hsl(220,15%,55%)]">{task.responsible.length} исполнителя</span>
                              </div>
                            )}
                            <div className={`text-xs mt-1.5 flex items-center gap-1 ${isOverdue(task.deadline) && task.status !== "done" ? "text-red-500" : "text-[hsl(220,15%,55%)]"}`}>
                              <Icon name="Calendar" size={11} />
                              {new Date(task.deadline).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
                            </div>
                          </div>
                          <button onClick={() => openReassign(task.id)} className="flex-shrink-0 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-sm border border-[hsl(220,20%,87%)] text-[hsl(220,15%,45%)] hover:border-[hsl(42,80%,50%)] hover:text-[hsl(42,60%,35%)] hover:bg-[hsl(42,80%,96%)] transition-all">
                            <Icon name="ArrowRightLeft" size={12} />
                            Изменить
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

      {/* TASK MODAL */}
      {taskModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-lg mx-4 animate-fade-in">
            <div className="px-6 py-5 border-b border-[hsl(220,20%,87%)] flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-[hsl(220,30%,12%)]">
                  {taskModal.mode === "edit"
                    ? (section === "reports" ? "Редактировать отчёт" : "Редактировать указание")
                    : (section === "reports" ? "Новый отчёт" : "Новое указание")}
                </h2>
                <p className="text-xs text-[hsl(220,15%,50%)] mt-0.5">{taskModal.mode === "edit" ? "Внесите изменения и сохраните" : "Заполните информацию о задаче"}</p>
              </div>
              <button onClick={() => setTaskModal({ open: false, mode: "create" })} className="p-1.5 rounded-sm hover:bg-[hsl(220,15%,93%)] text-[hsl(220,15%,50%)]">
                <Icon name="X" size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-xs font-medium text-[hsl(220,15%,40%)] block mb-1.5">Заголовок *</label>
                <input type="text" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="Введите название..." className="w-full text-sm border border-[hsl(220,20%,87%)] rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[hsl(221,45%,18%)]" />
              </div>

              <div>
                <label className="text-xs font-medium text-[hsl(220,15%,40%)] block mb-1.5">Описание</label>
                <textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Подробное описание..." rows={3} className="w-full text-sm border border-[hsl(220,20%,87%)] rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[hsl(221,45%,18%)] resize-none" />
              </div>

              <div>
                <label className="text-xs font-medium text-[hsl(220,15%,40%)] block mb-1.5">Назначил</label>
                <input type="text" value={taskForm.assignedBy} onChange={(e) => setTaskForm({ ...taskForm, assignedBy: e.target.value })}
                  placeholder="Кто назначает задачу..." className="w-full text-sm border border-[hsl(220,20%,87%)] rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[hsl(221,45%,18%)]" />
              </div>

              {/* Multi-select responsible */}
              <div>
                <label className="text-xs font-medium text-[hsl(220,15%,40%)] block mb-2">
                  Ответственные * {taskForm.responsible.length > 0 && <span className="text-[hsl(221,45%,40%)]">({taskForm.responsible.length} выбрано)</span>}
                </label>
                <div className="space-y-1.5 border border-[hsl(220,20%,87%)] rounded-sm p-2 max-h-40 overflow-y-auto">
                  {employees.map((emp) => {
                    const checked = taskForm.responsible.includes(emp.shortName);
                    return (
                      <label key={emp.id} className={`flex items-center gap-2.5 p-2 rounded-sm cursor-pointer transition-colors ${checked ? "bg-[hsl(221,45%,96%)]" : "hover:bg-[hsl(220,15%,97%)]"}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleFormResponsible(emp.shortName)} className="accent-[hsl(221,45%,18%)] w-3.5 h-3.5" />
                        <div className="w-6 h-6 rounded-full bg-[hsl(221,45%,18%)] flex items-center justify-center text-white text-[9px] font-semibold flex-shrink-0">
                          {emp.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[hsl(220,30%,12%)]">{emp.name}</div>
                          <div className="text-xs text-[hsl(220,15%,55%)]">{emp.position}</div>
                        </div>
                        {checked && <Icon name="Check" size={13} className="text-[hsl(221,45%,35%)] flex-shrink-0" />}
                      </label>
                    );
                  })}
                </div>
                {taskForm.responsible.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {taskForm.responsible.map((name) => (
                      <span key={name} className="inline-flex items-center gap-1 text-xs bg-[hsl(221,45%,15%)] text-white px-2 py-0.5 rounded-sm">
                        {name}
                        <button onClick={() => toggleFormResponsible(name)} className="hover:text-red-300 transition-colors ml-0.5">
                          <Icon name="X" size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {(section === "reports" || (taskModal.mode === "edit" && tasks.find((t) => t.id === taskModal.editId)?.section === "report")) && (
                <div>
                  <label className="text-xs font-medium text-[hsl(220,15%,40%)] block mb-1.5 flex items-center gap-1.5">
                    <Icon name="Link" size={12} />
                    Связано с указанием
                  </label>
                  <select
                    value={taskForm.linkedOrderId ?? ""}
                    onChange={(e) => setTaskForm({ ...taskForm, linkedOrderId: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full text-sm border border-[hsl(220,20%,87%)] rounded-sm px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[hsl(221,45%,18%)]"
                  >
                    <option value="">— Не привязан —</option>
                    {orderTasks.map((o) => (
                      <option key={o.id} value={o.id}>{o.number} — {o.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[hsl(220,15%,40%)] block mb-1.5">Приоритет</label>
                  <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as Priority })}
                    className="w-full text-sm border border-[hsl(220,20%,87%)] rounded-sm px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[hsl(221,45%,18%)]">
                    <option value="high">Высокий</option>
                    <option value="medium">Средний</option>
                    <option value="low">Низкий</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[hsl(220,15%,40%)] block mb-1.5">Срок исполнения *</label>
                  <input type="date" value={taskForm.deadline} onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                    className="w-full text-sm border border-[hsl(220,20%,87%)] rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[hsl(221,45%,18%)]" />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[hsl(220,20%,87%)] flex justify-end gap-2">
              <button onClick={() => setTaskModal({ open: false, mode: "create" })} className="btn-ghost">Отмена</button>
              <button onClick={saveTask} disabled={!taskForm.title || taskForm.responsible.length === 0 || !taskForm.deadline}
                className="btn-gold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                <Icon name={taskModal.mode === "edit" ? "Save" : "Plus"} size={14} />
                {taskModal.mode === "edit" ? "Сохранить" : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD EMPLOYEE MODAL */}
      {empModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-md mx-4 animate-fade-in">
            <div className="px-6 py-5 border-b border-[hsl(220,20%,87%)] flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-[hsl(220,30%,12%)]">Добавить сотрудника</h2>
                <p className="text-xs text-[hsl(220,15%,50%)] mt-0.5">Заполните данные нового сотрудника</p>
              </div>
              <button onClick={() => setEmpModal(false)} className="p-1.5 rounded-sm hover:bg-[hsl(220,15%,93%)] text-[hsl(220,15%,50%)]">
                <Icon name="X" size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-[hsl(220,15%,40%)] block mb-1.5">ФИО * <span className="font-normal text-[hsl(220,15%,55%)]">(Фамилия Имя Отчество)</span></label>
                <input type="text" value={empForm.name} onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                  placeholder="Иванов Иван Иванович" className="w-full text-sm border border-[hsl(220,20%,87%)] rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[hsl(221,45%,18%)]" />
              </div>
              <div>
                <label className="text-xs font-medium text-[hsl(220,15%,40%)] block mb-1.5">Должность *</label>
                <input type="text" value={empForm.position} onChange={(e) => setEmpForm({ ...empForm, position: e.target.value })}
                  placeholder="Главный специалист" className="w-full text-sm border border-[hsl(220,20%,87%)] rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[hsl(221,45%,18%)]" />
              </div>
              <div>
                <label className="text-xs font-medium text-[hsl(220,15%,40%)] block mb-1.5">Отдел *</label>
                <input type="text" value={empForm.department} onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
                  placeholder="Финансовый отдел" className="w-full text-sm border border-[hsl(220,20%,87%)] rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[hsl(221,45%,18%)]" />
              </div>
              <div>
                <label className="text-xs font-medium text-[hsl(220,15%,40%)] block mb-1.5">Email</label>
                <input type="email" value={empForm.email} onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                  placeholder="ivanov@corp.ru" className="w-full text-sm border border-[hsl(220,20%,87%)] rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[hsl(221,45%,18%)]" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[hsl(220,20%,87%)] flex justify-end gap-2">
              <button onClick={() => setEmpModal(false)} className="btn-ghost">Отмена</button>
              <button onClick={addEmployee} disabled={!empForm.name || !empForm.position || !empForm.department}
                className="btn-gold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                <Icon name="UserPlus" size={14} />Добавить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE EMPLOYEE CONFIRM */}
      {deleteEmpModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-sm mx-4 animate-fade-in">
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                  <Icon name="AlertTriangle" size={18} className="text-red-500" />
                </div>
                <div>
                  <div className="font-semibold text-[hsl(220,30%,12%)]">Удалить сотрудника?</div>
                  <div className="text-xs text-[hsl(220,15%,50%)] mt-0.5">Это действие нельзя отменить</div>
                </div>
              </div>
              <div className="bg-[hsl(220,15%,97%)] rounded-sm p-3 mb-4">
                <div className="font-medium text-sm text-[hsl(220,30%,12%)]">{deleteEmpModal.name}</div>
                <div className="text-xs text-[hsl(220,15%,50%)] mt-0.5">{deleteEmpModal.position} · {deleteEmpModal.department}</div>
                {employeeTasks(deleteEmpModal).length > 0 && (
                  <div className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <Icon name="AlertCircle" size={11} />
                    Сотрудник будет удалён из {employeeTasks(deleteEmpModal).length} задач
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteEmpModal(null)} className="btn-ghost">Отмена</button>
                <button onClick={confirmDeleteEmployee} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-red-700 transition-colors">
                  <Icon name="Trash2" size={14} />Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REASSIGN MODAL — multi-select */}
      {reassignModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-sm mx-4 animate-fade-in">
            <div className="px-6 py-5 border-b border-[hsl(220,20%,87%)] flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-[hsl(220,30%,12%)]">Исполнители задачи</h2>
                <p className="text-xs text-[hsl(220,15%,50%)] mt-0.5">Выберите одного или нескольких</p>
              </div>
              <button onClick={() => setReassignModal({ open: false })} className="p-1.5 rounded-sm hover:bg-[hsl(220,15%,93%)] text-[hsl(220,15%,50%)]">
                <Icon name="X" size={16} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-1.5">
              {employees.map((emp) => {
                const checked = reassignSelected.includes(emp.shortName);
                return (
                  <label key={emp.id} className={`flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-all ${checked ? "border-[hsl(221,45%,30%)] bg-[hsl(221,45%,97%)]" : "border-[hsl(220,20%,87%)] hover:border-[hsl(220,20%,75%)]"}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleReassign(emp.shortName)} className="accent-[hsl(221,45%,18%)] w-3.5 h-3.5" />
                    <div className="w-7 h-7 rounded-full bg-[hsl(221,45%,18%)] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {emp.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[hsl(220,30%,12%)]">{emp.name}</div>
                      <div className="text-xs text-[hsl(220,15%,50%)]">{emp.position}</div>
                    </div>
                    {checked && <Icon name="Check" size={14} className="text-[hsl(221,45%,35%)] flex-shrink-0" />}
                  </label>
                );
              })}
            </div>

            {reassignSelected.length > 0 && (
              <div className="px-6 pb-2 flex flex-wrap gap-1.5">
                {reassignSelected.map((name) => (
                  <span key={name} className="text-xs bg-[hsl(221,45%,15%)] text-white px-2 py-0.5 rounded-sm">{name}</span>
                ))}
              </div>
            )}

            <div className="px-6 py-4 border-t border-[hsl(220,20%,87%)] flex justify-between items-center">
              <span className="text-xs text-[hsl(220,15%,55%)]">{reassignSelected.length > 0 ? `Выбрано: ${reassignSelected.length}` : "Никто не выбран"}</span>
              <div className="flex gap-2">
                <button onClick={() => setReassignModal({ open: false })} className="btn-ghost">Отмена</button>
                <button onClick={confirmReassign} disabled={reassignSelected.length === 0}
                  className="btn-gold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                  <Icon name="Check" size={14} />Применить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onClick, isSelected, onEdit, onDelete, linkedOrder }: { task: Task; onClick: () => void; isSelected: boolean; onEdit: () => void; onDelete: () => void; linkedOrder?: Task }) {
  const overdue = new Date(task.deadline) < new Date() && task.status !== "done";
  return (
    <div onClick={onClick} className={`card-corp p-4 cursor-pointer transition-all duration-150 group ${isSelected ? "border-[hsl(221,45%,30%)] ring-1 ring-[hsl(221,45%,30%)]" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs text-[hsl(220,15%,55%)] font-mono-ibm">{task.number}</span>
            <span className={`status-badge ${statusClass[task.status]}`}>{statusLabel[task.status]}</span>
            {linkedOrder && (
              <span className="text-xs flex items-center gap-1 bg-[hsl(221,45%,95%)] text-[hsl(221,45%,35%)] px-1.5 py-0.5 rounded-sm font-medium">
                <Icon name="Link" size={10} />{linkedOrder.number}
              </span>
            )}
          </div>
          <div className="font-medium text-sm text-[hsl(220,30%,12%)] leading-snug line-clamp-2">{task.title}</div>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5">
              <AvatarGroup names={task.responsible} max={3} />
              <span className="text-xs text-[hsl(220,15%,55%)]">
                {task.responsible.length === 1 ? task.responsible[0] : `${task.responsible.length} исполнителя`}
              </span>
            </div>
            <span className={`text-xs flex items-center gap-1 ${overdue ? "text-red-600 font-medium" : "text-[hsl(220,15%,55%)]"}`}>
              <Icon name="Calendar" size={11} />
              {new Date(task.deadline).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
            </span>

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