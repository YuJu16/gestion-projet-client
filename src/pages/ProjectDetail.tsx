import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import PageBackground from "../components/PageBackground";
import GlassCard from "../components/GlassCard";
import Button from "../components/Button";

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

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const currentUserId = user?.id;

    const [project, setProject] = useState<ProjectData | null>(null);
    const [loading, setLoading] = useState(true);

    const [showTaskForm, setShowTaskForm] = useState(false);
    const [taskTitle, setTaskTitle] = useState("");
    const [taskDescription, setTaskDescription] = useState("");
    const [taskError, setTaskError] = useState("");

    const [showParticipantForm, setShowParticipantForm] = useState(false);
    const [participantIdentifier, setParticipantIdentifier] = useState("");
    const [participantError, setParticipantError] = useState("");

    const [statusFilter, setStatusFilter] = useState<"ALL" | Task["status"]>("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");

    const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
    const [assigningSelected, setAssigningSelected] = useState<Set<string>>(new Set());

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

    async function handleCreateTask(e: React.FormEvent) {
        e.preventDefault();
        setTaskError("");

        try {
            await api.post(`/projects/${id}/tasks`, {
                title: taskTitle,
                description: taskDescription,
            });
            setTaskTitle("");
            setTaskDescription("");
            setShowTaskForm(false);
            fetchProject();
        } catch (err: any) {
            setTaskError(err.response?.data?.error || "Une erreur est survenue");
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
            if (next.has(userId)) {
                next.delete(userId);
            } else {
                next.add(userId);
            }
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

    async function handleDeleteTask(taskId: string) {
        if (!confirm("Supprimer cette tâche ?")) return;

        try {
            await api.delete(`/projects/${id}/tasks/${taskId}`);
            fetchProject();
        } catch (err) {
            console.error(err);
        }
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

    async function handleRemoveParticipant(participantId: string) {
        if (!confirm("Retirer ce participant du projet ?")) return;

        try {
            await api.delete(`/projects/${id}/participants/${participantId}`);
            fetchProject();
        } catch (err) {
            console.error(err);
        }
    }

    if (loading) {
        return (
            <PageBackground>
                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-gray-700">Chargement...</p>
                </div>
            </PageBackground>
        );
    }

    if (!project) {
        return (
            <PageBackground>
                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-gray-700">Projet introuvable</p>
                </div>
            </PageBackground>
        );
    }

    const allMembers = [
        { id: project.owner.id, name: project.owner.name },
        ...project.participants.map((p) => ({ id: p.user.id, name: p.user.name })),
    ];

    const filteredTasks = project.tasks.filter((t) => {
        const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const visibleStatuses = statusFilter === "ALL" ? STATUSES : STATUSES.filter((s) => s.key === statusFilter);

    return (
        <PageBackground>
            <div className="min-h-screen p-8 max-w-6xl mx-auto">
                <button
                    onClick={() => navigate("/dashboard")}
                    className="text-gray-700 mb-6 hover:text-gray-900 transition flex items-center gap-1"
                >
                    ← Retour aux projets
                </button>

                <div className="flex justify-between items-start mb-8 animate-fade-in-up">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 tracking-wide">{project.title}</h1>
                        <p className="text-gray-700 mt-2">{project.description}</p>
                    </div>
                </div>

                <GlassCard
                    className="mb-8 animate-fade-in-up"
                    style={{ animationDelay: "0.05s", animationFillMode: "backwards" } as any}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">Participants</h2>
                        <Button variant="secondary" onClick={() => setShowParticipantForm(!showParticipantForm)}>
                            {showParticipantForm ? "Annuler" : "+ Ajouter"}
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-3 py-1 bg-pink-200/50 border border-white/60 text-pink-800 rounded-full text-sm">
                            {project.owner.name} (propriétaire)
                        </span>
                        {project.participants.map((p) => {
                            const canRemove = project.owner.id === currentUserId || p.user.id === currentUserId;
                            return (
                                <span
                                    key={p.id}
                                    className="px-3 py-1 bg-white/50 border border-white/60 text-gray-800 rounded-full text-sm flex items-center gap-2"
                                >
                                    {p.user.name}
                                    {canRemove && (
                                        <button
                                            onClick={() => handleRemoveParticipant(p.id)}
                                            className="text-gray-500 hover:text-red-600 transition"
                                            title={p.user.id === currentUserId ? "Quitter le projet" : "Retirer"}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </span>
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
                                className="flex-1 px-4 py-2 rounded-xl bg-white/50 border border-white/60 placeholder-gray-500 text-gray-900 outline-none focus:bg-white/70 transition"
                            />
                            <Button type="submit">Ajouter</Button>
                        </form>
                    )}
                    {participantError && <p className="text-red-600 text-sm mt-2">{participantError}</p>}
                </GlassCard>

                <div
                    className="flex flex-wrap items-center justify-between gap-4 mb-6 animate-fade-in-up"
                    style={{ animationDelay: "0.1s", animationFillMode: "backwards" } as any}
                >
                    <Button onClick={() => setShowTaskForm(!showTaskForm)}>
                        {showTaskForm ? "Annuler" : "+ Nouvelle tâche"}
                    </Button>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Rechercher une tâche..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-4 py-2 rounded-xl bg-white/50 border border-white/60 placeholder-gray-500 text-gray-900 outline-none focus:bg-white/70 transition text-sm"
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-4 py-2 rounded-xl bg-white/50 border border-white/60 text-gray-800 outline-none text-sm"
                        >
                            <option value="ALL">Tous les statuts</option>
                            {STATUSES.map((s) => (
                                <option key={s.key} value={s.key}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {showTaskForm && (
                    <GlassCard className="mb-8 animate-fade-in-up">
                        <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
                            <input
                                type="text"
                                placeholder="Titre de la tâche"
                                value={taskTitle}
                                onChange={(e) => setTaskTitle(e.target.value)}
                                required
                                className="px-4 py-3 rounded-xl bg-white/50 border border-white/60 placeholder-gray-500 text-gray-900 outline-none focus:bg-white/70 transition"
                            />
                            <textarea
                                placeholder="Description"
                                value={taskDescription}
                                onChange={(e) => setTaskDescription(e.target.value)}
                                required
                                rows={2}
                                className="px-4 py-3 rounded-xl bg-white/50 border border-white/60 placeholder-gray-500 text-gray-900 outline-none focus:bg-white/70 transition resize-none"
                            />
                            {taskError && <p className="text-red-600 text-sm">{taskError}</p>}
                            <Button type="submit">Créer la tâche</Button>
                        </form>
                    </GlassCard>
                )}

                <div className={`grid grid-cols-1 gap-6 ${visibleStatuses.length === 3 ? "md:grid-cols-3" : visibleStatuses.length === 2 ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
                    {visibleStatuses.map((statusCol, colIndex) => {
                        const tasksInColumn = filteredTasks.filter((t) => t.status === statusCol.key);

                        return (
                            <div
                                key={statusCol.key}
                                className="animate-fade-in-up"
                                style={{
                                    animationDelay: `${0.15 + colIndex * 0.05}s`,
                                    animationFillMode: "backwards",
                                } as any}
                            >
                                <h3 className="text-gray-800 font-semibold mb-3 px-2">
                                    {statusCol.label} ({tasksInColumn.length})
                                </h3>

                                <div className="flex flex-col gap-4">
                                    {tasksInColumn.map((task) => (
                                        <GlassCard key={task.id} className="!p-5">
                                            {editingTaskId === task.id ? (
                                                <div className="flex flex-col gap-2 mb-3">
                                                    <input
                                                        type="text"
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                        className="px-3 py-2 rounded-lg bg-white/60 border border-white/60 text-gray-900 outline-none text-sm"
                                                    />
                                                    <textarea
                                                        value={editDescription}
                                                        onChange={(e) => setEditDescription(e.target.value)}
                                                        rows={2}
                                                        className="px-3 py-2 rounded-lg bg-white/60 border border-white/60 text-gray-900 outline-none text-sm resize-none"
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button className="!px-4 !py-1.5 text-sm" onClick={() => handleSaveEdit(task.id)}>
                                                            Enregistrer
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            className="!px-4 !py-1.5 text-sm"
                                                            onClick={() => setEditingTaskId(null)}
                                                        >
                                                            Annuler
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-semibold text-gray-900">{task.title}</h4>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => startEditing(task)}
                                                            className="text-gray-500 hover:text-gray-900 text-sm transition"
                                                            title="Modifier la tâche"
                                                        >
                                                            ✎
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTask(task.id)}
                                                            className="text-gray-500 hover:text-red-600 text-sm transition"
                                                            title="Supprimer la tâche"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {editingTaskId !== task.id && (
                                                <>
                                                    <p className="text-gray-700 text-sm mb-4">{task.description}</p>

                                                    <select
                                                        value={task.status}
                                                        onChange={(e) => handleStatusChange(task.id, e.target.value as Task["status"])}
                                                        className="w-full text-sm px-3 py-2 rounded-lg bg-white/50 border border-white/60 text-gray-800 outline-none mb-2"
                                                    >
                                                        {STATUSES.map((s) => (
                                                            <option key={s.key} value={s.key}>
                                                                {s.label}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    {assigningTaskId === task.id ? (
                                                        <div className="bg-white/40 rounded-lg p-3 flex flex-col gap-2">
                                                            {allMembers.map((m) => (
                                                                <label key={m.id} className="flex items-center gap-2 text-sm text-gray-800">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={assigningSelected.has(m.id)}
                                                                        onChange={() => toggleAssignee(m.id)}
                                                                    />
                                                                    {m.name}
                                                                </label>
                                                            ))}
                                                            <div className="flex gap-2 mt-1">
                                                                <Button
                                                                    className="!px-4 !py-1.5 text-sm"
                                                                    onClick={() => handleSaveAssignees(task.id)}
                                                                >
                                                                    Enregistrer
                                                                </Button>
                                                                <Button
                                                                    variant="secondary"
                                                                    className="!px-4 !py-1.5 text-sm"
                                                                    onClick={() => setAssigningTaskId(null)}
                                                                >
                                                                    Annuler
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => startAssigning(task)}
                                                            className="w-full text-left text-sm px-3 py-2 rounded-lg bg-white/50 border border-white/60 text-gray-800 hover:bg-white/70 transition"
                                                        >
                                                            {task.assignees.length === 0
                                                                ? "Non assignée — cliquer pour assigner"
                                                                : `Assignée à : ${task.assignees.map((a) => a.user.name).join(", ")}`}
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </GlassCard>
                                    ))}

                                    {tasksInColumn.length === 0 && (
                                        <p className="text-gray-500 text-sm px-2">Aucune tâche</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </PageBackground>
    );
}