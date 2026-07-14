import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import PageBackground from "../components/PageBackground";
import GlassCard from "../components/GlassCard";
import Button from "../components/Button";

interface Participant {
    id: string;
    user: { id: string; name: string; email: string };
}

interface Task {
    id: string;
    title: string;
    description: string;
    status: "A_FAIRE" | "EN_COURS" | "TERMINE";
    assignedToId: string | null;
    assignedTo?: { id: string; name: string } | null;
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

    const [project, setProject] = useState<ProjectData | null>(null);
    const [loading, setLoading] = useState(true);

    const [showTaskForm, setShowTaskForm] = useState(false);
    const [taskTitle, setTaskTitle] = useState("");
    const [taskDescription, setTaskDescription] = useState("");
    const [taskError, setTaskError] = useState("");

    const [showParticipantForm, setShowParticipantForm] = useState(false);
    const [participantEmail, setParticipantEmail] = useState("");
    const [participantError, setParticipantError] = useState("");

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

    async function handleAssign(taskId: string, assignedToId: string) {
        try {
            await api.put(`/projects/${id}/tasks/${taskId}`, {
                assignedToId: assignedToId || null,
            });
            fetchProject();
        } catch (err) {
            console.error(err);
        }
    }

    async function handleAddParticipant(e: React.FormEvent) {
        e.preventDefault();
        setParticipantError("");

        try {
            await api.post(`/projects/${id}/participants`, { email: participantEmail });
            setParticipantEmail("");
            setShowParticipantForm(false);
            fetchProject();
        } catch (err: any) {
            setParticipantError(err.response?.data?.error || "Une erreur est survenue");
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

                {/* Section participants */}
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
                        {project.participants.map((p) => (
                            <span
                                key={p.id}
                                className="px-3 py-1 bg-white/50 border border-white/60 text-gray-800 rounded-full text-sm"
                            >
                                {p.user.name}
                            </span>
                        ))}
                    </div>

                    {showParticipantForm && (
                        <form onSubmit={handleAddParticipant} className="flex gap-2 mt-4">
                            <input
                                type="email"
                                placeholder="Email du participant"
                                value={participantEmail}
                                onChange={(e) => setParticipantEmail(e.target.value)}
                                required
                                className="flex-1 px-4 py-2 rounded-xl bg-white/50 border border-white/60 placeholder-gray-500 text-gray-900 outline-none focus:bg-white/70 transition"
                            />
                            <Button type="submit">Ajouter</Button>
                        </form>
                    )}
                    {participantError && <p className="text-red-600 text-sm mt-2">{participantError}</p>}
                </GlassCard>

                {/* Bouton nouvelle tâche */}
                <div
                    className="mb-6 animate-fade-in-up"
                    style={{ animationDelay: "0.1s", animationFillMode: "backwards" } as any}
                >
                    <Button onClick={() => setShowTaskForm(!showTaskForm)}>
                        {showTaskForm ? "Annuler" : "+ Nouvelle tâche"}
                    </Button>
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

                {/* Kanban */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {STATUSES.map((statusCol, colIndex) => {
                        const tasksInColumn = project.tasks.filter((t) => t.status === statusCol.key);

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
                                            <h4 className="font-semibold text-gray-900 mb-1">{task.title}</h4>
                                            <p className="text-gray-700 text-sm mb-4">{task.description}</p>

                                            <div className="flex flex-col gap-2">
                                                <select
                                                    value={task.status}
                                                    onChange={(e) =>
                                                        handleStatusChange(task.id, e.target.value as Task["status"])
                                                    }
                                                    className="text-sm px-3 py-2 rounded-lg bg-white/50 border border-white/60 text-gray-800 outline-none"
                                                >
                                                    {STATUSES.map((s) => (
                                                        <option key={s.key} value={s.key}>
                                                            {s.label}
                                                        </option>
                                                    ))}
                                                </select>

                                                <select
                                                    value={task.assignedToId || ""}
                                                    onChange={(e) => handleAssign(task.id, e.target.value)}
                                                    className="text-sm px-3 py-2 rounded-lg bg-white/50 border border-white/60 text-gray-800 outline-none"
                                                >
                                                    <option value="">Non assignée</option>
                                                    <option value={project.owner.id}>{project.owner.name}</option>
                                                    {project.participants.map((p) => (
                                                        <option key={p.user.id} value={p.user.id}>
                                                            {p.user.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
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