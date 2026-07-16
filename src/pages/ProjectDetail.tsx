import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import PageBackground from "../components/PageBackground";
import GlassCard from "../components/GlassCard";
import Button from "../components/Button";
import Avatar from "../components/Avatar";
import ConfirmDialog from "../components/ConfirmDialog";

interface Participant {
    id: string;
    user: { id: string; name: string; email: string };
}

interface Assignee {
    user: { id: string; name: string };
}

interface Task {
    id: string;
    title: string;
    description: string;
    status: "A_FAIRE" | "EN_COURS" | "TERMINE";
    assignees: Assignee[];
}

interface ProjectData {
    id: string;
    title: string;
    description: string;
    owner: { id: string; name: string; email: string };
    participants: Participant[];
    tasks: Task[];
}

const STATUSES: { key: Task["status"]; label: string }[] = [
    { key: "A_FAIRE", label: "À faire" },
    { key: "EN_COURS", label: "En cours" },
    { key: "TERMINE", label: "Terminé" },
];

const STATUS_CONFIG: Record<
    Task["status"],
    { gradient: string; bg: string; text: string; border: string }
> = {
    A_FAIRE: {
        gradient: "from-rose-400 to-pink-500",
        bg: "bg-rose-50",
        text: "text-rose-600",
        border: "border-rose-200",
    },
    EN_COURS: {
        gradient: "from-orange-400 to-amber-400",
        bg: "bg-orange-50",
        text: "text-orange-600",
        border: "border-orange-200",
    },
    TERMINE: {
        gradient: "from-violet-400 to-purple-500",
        bg: "bg-violet-50",
        text: "text-violet-600",
        border: "border-violet-200",
    },
};

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const currentUserId = user?.id;

    const [project, setProject] = useState<ProjectData | null>(null);
    const [loading, setLoading] = useState(true);

    // Task creation form
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [taskTitle, setTaskTitle] = useState("");
    const [taskDescription, setTaskDescription] = useState("");
    const [taskError, setTaskError] = useState("");
    const [createAssignees, setCreateAssignees] = useState<Set<string>>(new Set());

    // Participant form
    const [showParticipantForm, setShowParticipantForm] = useState(false);
    const [participantIdentifier, setParticipantIdentifier] = useState("");
    const [participantError, setParticipantError] = useState("");

    // Filters
    const [statusFilter, setStatusFilter] = useState<"ALL" | Task["status"]>("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    // Edit mode
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");

    // Assign mode
    const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
    const [assigningSelected, setAssigningSelected] = useState<Set<string>>(new Set());

    // Inline quick-add per column
    const [inlineAddStatus, setInlineAddStatus] = useState<Task["status"] | null>(null);
    const [inlineTitle, setInlineTitle] = useState("");
    const [inlineDescription, setInlineDescription] = useState("");

    // Confirmation dialog (delete task / remove participant)
    const [confirmAction, setConfirmAction] = useState<{
        message: string;
        onConfirm: () => void;
    } | null>(null);

    // Pagination des cartes par colonne (3 par page, navigation par flèches)
    const CARDS_PER_PAGE = 3;
    const [columnPage, setColumnPage] = useState<Record<string, number>>({});

    async function fetchProject() {
        try {
            const res = await api.get(`/projects/${id}`);
            setProject(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchProject();
    }, [id]);

    function toggleCreateAssignee(userId: string) {
        setCreateAssignees((prev) => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    }

    async function handleCreateTask(e: React.FormEvent) {
        e.preventDefault();
        setTaskError("");
        try {
            const res = await api.post(`/projects/${id}/tasks`, {
                title: taskTitle,
                description: taskDescription,
            });
            // assign selected members right after creation
            if (createAssignees.size > 0) {
                await api.put(`/projects/${id}/tasks/${res.data.id}/assignees`, {
                    userIds: Array.from(createAssignees),
                });
            }
            setTaskTitle("");
            setTaskDescription("");
            setCreateAssignees(new Set());
            setShowTaskForm(false);
            fetchProject();
        } catch (err: any) {
            setTaskError(err.response?.data?.error || "Une erreur est survenue");
        }
    }

    async function handleInlineAdd(status: Task["status"]) {
        if (!inlineTitle.trim()) return;
        try {
            await api.post(`/projects/${id}/tasks`, {
                title: inlineTitle.trim(),
                description: inlineDescription.trim(),
                status,
            });
            setInlineTitle("");
            setInlineDescription("");
            setInlineAddStatus(null);
            fetchProject();
        } catch (err) {
            console.error(err);
        }
    }

    async function handleStatusChange(taskId: string, newStatus: Task["status"]) {
        try {
            await api.put(`/projects/${id}/tasks/${taskId}`, { status: newStatus });
            fetchProject();
        } catch (err) {
            console.error(err);
        }
    }

    function startEditing(task: Task) {
        setEditingTaskId(task.id);
        setEditTitle(task.title);
        setEditDescription(task.description);
    }

    async function handleSaveEdit(taskId: string) {
        try {
            await api.put(`/projects/${id}/tasks/${taskId}`, {
                title: editTitle,
                description: editDescription,
            });
            setEditingTaskId(null);
            fetchProject();
        } catch (err) {
            console.error(err);
        }
    }

    function startAssigning(task: Task) {
        setAssigningTaskId(task.id);
        setAssigningSelected(new Set(task.assignees.map((a) => a.user.id)));
    }

    function toggleAssignee(userId: string) {
        setAssigningSelected((prev) => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    }

    async function handleSaveAssignees(taskId: string) {
        try {
            await api.put(`/projects/${id}/tasks/${taskId}/assignees`, {
                userIds: Array.from(assigningSelected),
            });
            setAssigningTaskId(null);
            fetchProject();
        } catch (err) {
            console.error(err);
        }
    }

    function handleDeleteTask(taskId: string) {
        setConfirmAction({
            message: "Supprimer cette tâche ?",
            onConfirm: async () => {
                setConfirmAction(null);
                try {
                    await api.delete(`/projects/${id}/tasks/${taskId}`);
                    fetchProject();
                } catch (err) {
                    console.error(err);
                }
            },
        });
    }

    async function handleAddParticipant(e: React.FormEvent) {
        e.preventDefault();
        setParticipantError("");
        try {
            await api.post(`/projects/${id}/participants`, { identifier: participantIdentifier });
            setParticipantIdentifier("");
            setShowParticipantForm(false);
            fetchProject();
        } catch (err: any) {
            setParticipantError(err.response?.data?.error || "Une erreur est survenue");
        }
    }

    function handleRemoveParticipant(participantId: string) {
        setConfirmAction({
            message: "Retirer ce participant du projet ?",
            onConfirm: async () => {
                setConfirmAction(null);
                try {
                    await api.delete(`/projects/${id}/participants/${participantId}`);
                    fetchProject();
                } catch (err) {
                    console.error(err);
                }
            },
        });
    }

    if (loading) {
        return (
            <PageBackground>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 animate-pulse" />
                        <p className="text-gray-600 text-sm">Chargement du projet...</p>
                    </div>
                </div>
            </PageBackground>
        );
    }

    if (!project) {
        return (
            <PageBackground>
                <div className="min-h-screen flex items-center justify-center">
                    <GlassCard className="text-center py-12 px-16">
                        <p className="text-gray-800 font-semibold">Projet introuvable</p>
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="mt-3 text-pink-500 text-sm hover:text-pink-600 transition"
                        >
                            ← Retour au tableau de bord
                        </button>
                    </GlassCard>
                </div>
            </PageBackground>
        );
    }

    const allMembers = [
        { id: project.owner.id, name: project.owner.name },
        ...project.participants.map((p) => ({ id: p.user.id, name: p.user.name })),
    ];

    // startsWith so "f" matches "fqzd..." but not "bbqfqsDf"
    const filteredTasks = project.tasks.filter((t) => {
        const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
        const matchesSearch =
            searchQuery === "" ||
            t.title.toLowerCase().startsWith(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const visibleStatuses =
        statusFilter === "ALL" ? STATUSES : STATUSES.filter((s) => s.key === statusFilter);

    const totalTasks = project.tasks.length;
    const doneTasks = project.tasks.filter((t) => t.status === "TERMINE").length;

    return (
        <PageBackground>
            <div className="min-h-screen">
                {/* Sticky header */}
                <header className="sticky top-0 z-20 backdrop-blur-2xl bg-white/30 border-b border-white/50 shadow-sm">
                    <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center gap-4">
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition text-sm font-medium flex-shrink-0"
                        >
                            ← Mes projets
                        </button>
                        <h1 className="font-bold text-gray-900 text-base truncate hidden sm:block">
                            {project.title}
                        </h1>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Avatar name={user?.name ?? "?"} size="xs" />
                            <span className="text-sm text-gray-700 hidden md:block">{user?.name}</span>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-6 py-6">
                    {/* Project hero */}
                    <div className="mb-6 animate-fade-in-up">
                        <h2 className="text-4xl font-bold text-gray-900 mb-2">{project.title}</h2>
                        <p className="text-gray-700 text-base mb-4 max-w-3xl leading-relaxed">{project.description}</p>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/50 border border-white/70 text-xs font-medium text-gray-700">
                                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-400 to-orange-400" />
                                {allMembers.length} membre{allMembers.length > 1 ? "s" : ""}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/50 border border-white/70 text-xs font-medium text-gray-700">
                                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-400 to-purple-400" />
                                {totalTasks} tâche{totalTasks > 1 ? "s" : ""}
                            </span>
                            {totalTasks > 0 && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-xs font-medium text-violet-700">
                                    ✓ {doneTasks} terminée{doneTasks > 1 ? "s" : ""}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Members card */}
                    <GlassCard
                        className="mb-6 animate-fade-in-up"
                        style={{ animationDelay: "0.05s", animationFillMode: "backwards" } as any}
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <h3 className="font-semibold text-gray-900">Équipe</h3>
                            <Button
                                variant="secondary"
                                onClick={() => setShowParticipantForm(!showParticipantForm)}
                                className="!py-1.5 !px-4 text-sm"
                            >
                                {showParticipantForm ? "Annuler" : "+ Ajouter un membre"}
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <div className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-pink-100/60 border border-pink-200">
                                <Avatar name={project.owner.name} size="xs" />
                                <span className="text-xs font-medium text-pink-800">{project.owner.name}</span>
                                <span className="text-[10px]">👑</span>
                            </div>
                            {project.participants.map((p) => {
                                const canRemove =
                                    project.owner.id === currentUserId || p.user.id === currentUserId;
                                return (
                                    <div
                                        key={p.id}
                                        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-white/50 border border-white/70"
                                    >
                                        <Avatar name={p.user.name} size="xs" />
                                        <span className="text-xs font-medium text-gray-800">{p.user.name}</span>
                                        {canRemove && (
                                            <button
                                                onClick={() => handleRemoveParticipant(p.id)}
                                                className="w-4 h-4 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 transition text-[10px]"
                                                title={p.user.id === currentUserId ? "Quitter" : "Retirer"}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {showParticipantForm && (
                            <form onSubmit={handleAddParticipant} className="flex gap-2 mt-4">
                                <input
                                    type="text"
                                    placeholder="Email ou pseudo du participant"
                                    value={participantIdentifier}
                                    onChange={(e) => setParticipantIdentifier(e.target.value)}
                                    required
                                    className="flex-1 px-4 py-2 rounded-xl bg-white/50 border border-white/70 placeholder-gray-400 text-gray-900 outline-none focus:bg-white/70 focus:border-pink-300 transition text-sm"
                                />
                                <Button type="submit" className="!py-2 !px-4 text-sm">
                                    Ajouter
                                </Button>
                            </form>
                        )}
                        {participantError && (
                            <p className="text-red-600 text-xs mt-2">{participantError}</p>
                        )}
                    </GlassCard>

                    {/* Toolbar */}
                    <div
                        className="flex flex-wrap items-center justify-between gap-3 mb-5 animate-fade-in-up"
                        style={{ animationDelay: "0.1s", animationFillMode: "backwards" } as any}
                    >
                        {/* Status filter pills */}
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => setStatusFilter("ALL")}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                                    statusFilter === "ALL"
                                        ? "bg-gray-800 text-white border-gray-800"
                                        : "bg-white/50 text-gray-600 border-white/60 hover:bg-white/70"
                                }`}
                            >
                                Toutes
                            </button>
                            {STATUSES.map((s) => {
                                const cfg = STATUS_CONFIG[s.key];
                                const active = statusFilter === s.key;
                                return (
                                    <button
                                        key={s.key}
                                        onClick={() =>
                                            setStatusFilter(statusFilter === s.key ? "ALL" : s.key)
                                        }
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                                            active
                                                ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                                                : "bg-white/50 text-gray-600 border-white/60 hover:bg-white/70"
                                        }`}
                                    >
                                        {s.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8 pr-4 py-2 rounded-xl bg-white/50 border border-white/70 placeholder-gray-400 text-gray-900 outline-none focus:bg-white/70 focus:border-pink-300 transition text-sm w-40"
                                />
                            </div>
                            <Button
                                onClick={() => setShowTaskForm(!showTaskForm)}
                                className="!py-2 !px-4 text-sm"
                            >
                                {showTaskForm ? "✕ Annuler" : "+ Nouvelle tâche"}
                            </Button>
                        </div>
                    </div>

                    {/* Task creation form — avec description + assignation */}
                    {showTaskForm && (
                        <GlassCard className="mb-6 animate-fade-in-up">
                            <h3 className="text-base font-semibold text-gray-900 mb-4">Nouvelle tâche</h3>
                            <form onSubmit={handleCreateTask} className="flex flex-col gap-3">
                                <input
                                    type="text"
                                    placeholder="Titre de la tâche *"
                                    value={taskTitle}
                                    onChange={(e) => setTaskTitle(e.target.value)}
                                    required
                                    className="px-4 py-3 rounded-xl bg-white/50 border border-white/70 placeholder-gray-400 text-gray-900 outline-none focus:bg-white/70 focus:border-pink-300 transition text-sm"
                                />
                                <textarea
                                    placeholder="Description (optionnel)"
                                    value={taskDescription}
                                    onChange={(e) => setTaskDescription(e.target.value)}
                                    rows={2}
                                    className="px-4 py-3 rounded-xl bg-white/50 border border-white/70 placeholder-gray-400 text-gray-900 outline-none focus:bg-white/70 focus:border-pink-300 transition resize-none text-sm"
                                />

                                {/* Assignation à la création */}
                                {allMembers.length > 0 && (
                                    <div className="bg-white/30 rounded-xl p-3 border border-white/60">
                                        <p className="text-xs font-semibold text-gray-700 mb-2">
                                            Assigner à (optionnel) :
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {allMembers.map((m) => (
                                                <label
                                                    key={m.id}
                                                    className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-800 bg-white/40 hover:bg-white/60 border border-white/60 rounded-full pl-1 pr-3 py-1 transition"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={createAssignees.has(m.id)}
                                                        onChange={() => toggleCreateAssignee(m.id)}
                                                        className="accent-pink-500"
                                                    />
                                                    <Avatar name={m.name} size="xs" />
                                                    {m.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {taskError && <p className="text-red-600 text-xs">{taskError}</p>}
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="secondary"
                                        type="button"
                                        onClick={() => {
                                            setShowTaskForm(false);
                                            setCreateAssignees(new Set());
                                        }}
                                        className="!py-2 !px-4 text-sm"
                                    >
                                        Annuler
                                    </Button>
                                    <Button type="submit" className="!py-2 !px-4 text-sm">
                                        Créer la tâche
                                    </Button>
                                </div>
                            </form>
                        </GlassCard>
                    )}

                    {/* Kanban board */}
                    <div
                        className={`grid grid-cols-1 gap-5 ${
                            visibleStatuses.length === 3
                                ? "md:grid-cols-3"
                                : visibleStatuses.length === 2
                                ? "md:grid-cols-2"
                                : ""
                        }`}
                    >
                        {visibleStatuses.map((statusCol, colIndex) => {
                            const cfg = STATUS_CONFIG[statusCol.key];
                            const tasksInColumn = filteredTasks.filter(
                                (t) => t.status === statusCol.key
                            );
                            const isInlineOpen = inlineAddStatus === statusCol.key;
                            const totalPages = Math.max(1, Math.ceil(tasksInColumn.length / CARDS_PER_PAGE));
                            const currentPage = Math.min(columnPage[statusCol.key] ?? 0, totalPages - 1);
                            const pagedTasks = tasksInColumn.slice(
                                currentPage * CARDS_PER_PAGE,
                                currentPage * CARDS_PER_PAGE + CARDS_PER_PAGE
                            );

                            return (
                                <div
                                    key={statusCol.key}
                                    className="animate-fade-in-up"
                                    style={{
                                        animationDelay: `${0.15 + colIndex * 0.05}s`,
                                        animationFillMode: "backwards",
                                    } as any}
                                >
                                    {/* Column header */}
                                    <div
                                        className={`flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r ${cfg.gradient} shadow-sm mb-3`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-semibold text-sm">
                                                {statusCol.label}
                                            </span>
                                            <span className="bg-white/30 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                {tasksInColumn.length}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() =>
                                                setInlineAddStatus(isInlineOpen ? null : statusCol.key)
                                            }
                                            className="text-white/80 hover:text-white transition text-xl leading-none"
                                            title="Ajouter une tâche"
                                        >
                                            {isInlineOpen ? "×" : "+"}
                                        </button>
                                    </div>

                                    {/* Inline quick-add avec description */}
                                    {isInlineOpen && (
                                        <div className="flex-shrink-0 mb-3 bg-white/40 backdrop-blur-sm rounded-2xl p-3 border border-white/60">
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Titre de la tâche..."
                                                value={inlineTitle}
                                                onChange={(e) => setInlineTitle(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && !e.shiftKey)
                                                        handleInlineAdd(statusCol.key);
                                                    if (e.key === "Escape")
                                                        setInlineAddStatus(null);
                                                }}
                                                className="w-full px-3 py-2 rounded-xl bg-white/60 border border-white/70 text-gray-900 text-sm outline-none focus:bg-white/80 transition placeholder-gray-400 mb-2"
                                            />
                                            <textarea
                                                placeholder="Description (optionnel)"
                                                value={inlineDescription}
                                                onChange={(e) => setInlineDescription(e.target.value)}
                                                rows={2}
                                                className="w-full px-3 py-2 rounded-xl bg-white/60 border border-white/70 text-gray-900 text-sm outline-none focus:bg-white/80 transition placeholder-gray-400 resize-none"
                                            />
                                            <div className="flex gap-2 mt-2">
                                                <Button
                                                    className="!py-1.5 !px-3 text-xs"
                                                    onClick={() => handleInlineAdd(statusCol.key)}
                                                >
                                                    Ajouter
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    className="!py-1.5 !px-3 text-xs"
                                                    onClick={() => {
                                                        setInlineAddStatus(null);
                                                        setInlineTitle("");
                                                        setInlineDescription("");
                                                    }}
                                                >
                                                    Annuler
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Task cards — 3 par page, navigation par flèches */}
                                    <div className="flex flex-col gap-3">
                                        {pagedTasks.map((task) => (
                                            <GlassCard key={task.id} className="!p-0 overflow-hidden">
                                                <div className="flex min-h-0">
                                                    {/* Status left stripe */}
                                                    <div
                                                        className={`w-1.5 flex-shrink-0 bg-gradient-to-b ${cfg.gradient}`}
                                                    />
                                                    <div className="flex-1 p-4 min-w-0">
                                                        {/* ── Edit mode ── */}
                                                        {editingTaskId === task.id ? (
                                                            <div className="flex flex-col gap-2 mb-3">
                                                                <input
                                                                    type="text"
                                                                    value={editTitle}
                                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                                    className="w-full px-3 py-2 rounded-lg bg-white/60 border border-white/70 text-gray-900 outline-none text-sm focus:bg-white/80 transition"
                                                                />
                                                                <textarea
                                                                    value={editDescription}
                                                                    onChange={(e) => setEditDescription(e.target.value)}
                                                                    rows={2}
                                                                    placeholder="Description"
                                                                    className="w-full px-3 py-2 rounded-lg bg-white/60 border border-white/70 text-gray-900 outline-none text-sm resize-none focus:bg-white/80 transition"
                                                                />
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        className="!py-1.5 !px-3 text-xs"
                                                                        onClick={() => handleSaveEdit(task.id)}
                                                                    >
                                                                        Enregistrer
                                                                    </Button>
                                                                    <Button
                                                                        variant="secondary"
                                                                        className="!py-1.5 !px-3 text-xs"
                                                                        onClick={() => setEditingTaskId(null)}
                                                                    >
                                                                        Annuler
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            /* ── Normal mode ── */
                                                            <>
                                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                                    <h4 className="font-semibold text-gray-900 text-sm leading-snug break-words min-w-0">
                                                                        {task.title}
                                                                    </h4>
                                                                    <div className="flex gap-1 flex-shrink-0">
                                                                        <button
                                                                            onClick={() => startEditing(task)}
                                                                            className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-white/60 transition text-sm"
                                                                            title="Modifier"
                                                                        >
                                                                            ✎
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteTask(task.id)}
                                                                            className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50/50 transition text-xs"
                                                                            title="Supprimer"
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                {task.description && (
                                                                    <p className="text-gray-500 text-xs mb-3 leading-relaxed max-h-16 overflow-y-auto break-words whitespace-pre-wrap pr-1 scroll-thin">
                                                                        {task.description}
                                                                    </p>
                                                                )}
                                                                {/* Status pills */}
                                                                <div className="flex flex-wrap gap-1.5 mb-3">
                                                                    {STATUSES.map((s) => {
                                                                        const sCfg = STATUS_CONFIG[s.key];
                                                                        const active = task.status === s.key;
                                                                        return (
                                                                            <button
                                                                                key={s.key}
                                                                                onClick={() =>
                                                                                    !active &&
                                                                                    handleStatusChange(task.id, s.key)
                                                                                }
                                                                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition ${
                                                                                    active
                                                                                        ? `${sCfg.bg} ${sCfg.text} ${sCfg.border}`
                                                                                        : "bg-white/40 text-gray-400 border-white/50 hover:bg-white/70 hover:text-gray-600 cursor-pointer"
                                                                                }`}
                                                                            >
                                                                                {s.label}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </>
                                                        )}

                                                        {/* ── Assignees — always visible ── */}
                                                        {assigningTaskId === task.id ? (
                                                            <div className="bg-white/40 rounded-xl p-3 flex flex-col gap-2 mt-1">
                                                                <p className="text-xs font-semibold text-gray-700">
                                                                    Assigner à :
                                                                </p>
                                                                {allMembers.map((m) => (
                                                                    <label
                                                                        key={m.id}
                                                                        className="flex items-center gap-2 text-xs text-gray-800 cursor-pointer"
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={assigningSelected.has(m.id)}
                                                                            onChange={() => toggleAssignee(m.id)}
                                                                            className="accent-pink-500"
                                                                        />
                                                                        <Avatar name={m.name} size="xs" />
                                                                        {m.name}
                                                                    </label>
                                                                ))}
                                                                <div className="flex gap-2 mt-1">
                                                                    <Button
                                                                        className="!py-1 !px-3 text-xs"
                                                                        onClick={() => handleSaveAssignees(task.id)}
                                                                    >
                                                                        Enregistrer
                                                                    </Button>
                                                                    <Button
                                                                        variant="secondary"
                                                                        className="!py-1 !px-3 text-xs"
                                                                        onClick={() => setAssigningTaskId(null)}
                                                                    >
                                                                        Annuler
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => startAssigning(task)}
                                                                className="w-full flex items-center gap-2 mt-1 group/assign"
                                                            >
                                                                {task.assignees.length > 0 ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex -space-x-1.5">
                                                                            {task.assignees.slice(0, 3).map((a) => (
                                                                                <Avatar
                                                                                    key={a.user.id}
                                                                                    name={a.user.name}
                                                                                    size="xs"
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                        <span className="text-[10px] text-gray-500 group-hover/assign:text-pink-500 transition">
                                                                            {task.assignees
                                                                                .map((a) => a.user.name)
                                                                                .join(", ")}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-[10px] text-gray-400 group-hover/assign:text-pink-500 transition px-2 py-1 rounded-lg border border-dashed border-gray-300 group-hover/assign:border-pink-300">
                                                                        + Assigner
                                                                    </span>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </GlassCard>
                                        ))}

                                        {/* Empty column */}
                                        {tasksInColumn.length === 0 && !isInlineOpen && (
                                            <div className="text-center py-8 border-2 border-dashed border-white/40 rounded-2xl">
                                                <p className="text-gray-400 text-xs">Aucune tâche</p>
                                                <button
                                                    onClick={() => setInlineAddStatus(statusCol.key)}
                                                    className="mt-2 text-xs text-pink-400 hover:text-pink-600 transition"
                                                >
                                                    + Ajouter une tâche
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Navigation — 3 cartes par page */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-3 mt-3">
                                            <button
                                                onClick={() =>
                                                    setColumnPage((prev) => ({
                                                        ...prev,
                                                        [statusCol.key]: Math.max(0, currentPage - 1),
                                                    }))
                                                }
                                                disabled={currentPage === 0}
                                                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/50 border border-white/70 text-gray-600 hover:bg-white/80 hover:text-gray-900 transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/50"
                                                title="Page précédente"
                                            >
                                                ‹
                                            </button>
                                            <span className="text-xs text-gray-500 font-medium">
                                                {currentPage + 1} / {totalPages}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    setColumnPage((prev) => ({
                                                        ...prev,
                                                        [statusCol.key]: Math.min(totalPages - 1, currentPage + 1),
                                                    }))
                                                }
                                                disabled={currentPage === totalPages - 1}
                                                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/50 border border-white/70 text-gray-600 hover:bg-white/80 hover:text-gray-900 transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/50"
                                                title="Page suivante"
                                            >
                                                ›
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {confirmAction && (
                <ConfirmDialog
                    message={confirmAction.message}
                    onConfirm={confirmAction.onConfirm}
                    onCancel={() => setConfirmAction(null)}
                />
            )}
        </PageBackground>
    );
}
