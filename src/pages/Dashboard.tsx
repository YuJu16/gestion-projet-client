import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import PageBackground from "../components/PageBackground";
import GlassCard from "../components/GlassCard";
import Button from "../components/Button";
import Avatar from "../components/Avatar";
import ConfirmDialog from "../components/ConfirmDialog";

interface Project {
    id: string;
    title: string;
    description: string;
    owner: { id: string; name: string; email: string };
    participants: { user: { id: string; name: string } }[];
}

const ACCENT_GRADIENTS = [
    "from-pink-400 to-rose-500",
    "from-orange-400 to-amber-300",
    "from-violet-400 to-purple-500",
    "from-rose-400 to-pink-400",
    "from-amber-400 to-orange-400",
    "from-fuchsia-400 to-pink-400",
];

export default function Dashboard() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [confirmProjectId, setConfirmProjectId] = useState<string | null>(null);

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    async function fetchProjects() {
        try {
            const res = await api.get("/projects");
            setProjects(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchProjects();
    }, []);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        try {
            await api.post("/projects", { title, description });
            setTitle("");
            setDescription("");
            setShowForm(false);
            fetchProjects();
        } catch (err: any) {
            setError(err.response?.data?.error || "Une erreur est survenue");
        }
    }

    function handleDelete(e: React.MouseEvent, projectId: string) {
        e.stopPropagation();
        setActionError("");
        setConfirmProjectId(projectId);
    }

    async function confirmDeleteProject() {
        const projectId = confirmProjectId;
        setConfirmProjectId(null);
        if (!projectId) return;
        try {
            await api.delete(`/projects/${projectId}`);
            fetchProjects();
        } catch (err: any) {
            setActionError(err.response?.data?.error || "Impossible de supprimer ce projet");
        }
    }

    const ownedCount = projects.filter((p) => p.owner.id === user?.id).length;
    const participantCount = projects.length - ownedCount;

    return (
        <PageBackground>
            <div className="min-h-screen">
                {/* Sticky Navbar */}
                <header className="sticky top-0 z-20 backdrop-blur-2xl bg-white/30 border-b border-white/50 shadow-sm">
                    <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center shadow-md shadow-pink-300/40">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                                </svg>
                            </div>
                            <span className="font-bold text-gray-900 text-base tracking-tight">ProjektFlow</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-white/40 border border-white/60 rounded-full pl-2 pr-3 py-1">
                                <Avatar name={user?.name ?? "?"} size="xs" />
                                <span className="text-sm font-medium text-gray-800 hidden sm:block">{user?.name}</span>
                            </div>
                            <Button variant="secondary" onClick={logout} className="!py-1.5 !px-4 text-sm">
                                Déconnexion
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="max-w-6xl mx-auto px-6 py-8">
                    {/* Welcome */}
                    <div className="mb-8 animate-fade-in-up">
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">
                            Bonjour,{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-400">
                                {user?.name?.split(" ")[0]}
                            </span>{" "}
                        </h1>
                        {!loading && (
                            <p className="text-gray-500 text-sm">
                                {projects.length === 0
                                    ? "Aucun projet pour l'instant — commence par en créer un !"
                                    : [
                                        ownedCount > 0 &&
                                        `${ownedCount} projet${ownedCount > 1 ? "s" : ""} créé${ownedCount > 1 ? "s" : ""}`,
                                        participantCount > 0 &&
                                        `participant dans ${participantCount} projet${participantCount > 1 ? "s" : ""}`,
                                    ]
                                        .filter(Boolean)
                                        .join(" · ")}
                            </p>
                        )}
                    </div>

                    {actionError && (
                        <div className="mb-6 px-4 py-3 rounded-xl bg-red-100/70 border border-red-300 text-red-700 text-sm">
                            {actionError}
                        </div>
                    )}

                    {/* Toolbar */}
                    <div
                        className="flex items-center justify-between mb-5 animate-fade-in-up"
                        style={{ animationDelay: "0.05s", animationFillMode: "backwards" } as any}
                    >
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-semibold text-gray-900">Mes projets</h2>
                            {projects.length > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-pink-100 text-pink-700 border border-pink-200">
                                    {projects.length}
                                </span>
                            )}
                        </div>
                        <Button onClick={() => setShowForm(!showForm)}>
                            {showForm ? "✕ Annuler" : "+ Nouveau projet"}
                        </Button>
                    </div>

                    {/* Create form */}
                    {showForm && (
                        <GlassCard className="mb-8 animate-fade-in-up">
                            <h3 className="text-base font-semibold text-gray-900 mb-4">Nouveau projet</h3>
                            <form onSubmit={handleCreate} className="flex flex-col gap-3">
                                <input
                                    type="text"
                                    placeholder="Titre du projet *"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    className="px-4 py-3 rounded-xl bg-white/50 border border-white/70 placeholder-gray-400 text-gray-900 outline-none focus:bg-white/70 focus:border-pink-300 transition text-sm"
                                />
                                <textarea
                                    placeholder="Description *"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                    rows={3}
                                    className="px-4 py-3 rounded-xl bg-white/50 border border-white/70 placeholder-gray-400 text-gray-900 outline-none focus:bg-white/70 focus:border-pink-300 transition resize-none text-sm"
                                />
                                {error && <p className="text-red-600 text-xs">{error}</p>}
                                <div className="flex justify-end gap-2 pt-1">
                                    <Button
                                        variant="secondary"
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="!py-2 !px-4 text-sm"
                                    >
                                        Annuler
                                    </Button>
                                    <Button type="submit" className="!py-2 !px-4 text-sm">
                                        Créer
                                    </Button>
                                </div>
                            </form>
                        </GlassCard>
                    )}

                    {/* Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {[1, 2, 3, 4].map((n) => (
                                <div key={n} className="h-44 rounded-3xl bg-white/25 animate-pulse" />
                            ))}
                        </div>
                    ) : projects.length === 0 ? (
                        <GlassCard className="text-center py-16 animate-fade-in-up">
                            <div className="text-5xl mb-3">🗂️</div>
                            <p className="text-gray-800 font-semibold">Aucun projet pour l'instant</p>
                            <p className="text-gray-500 text-sm mt-1">Clique sur "+ Nouveau projet" pour démarrer</p>
                        </GlassCard>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {projects.map((project, i) => {
                                const isOwner = project.owner.id === user?.id;
                                const allMembers = [
                                    { id: project.owner.id, name: project.owner.name },
                                    ...project.participants.map((p) => ({ id: p.user.id, name: p.user.name })),
                                ];
                                const memberCount = allMembers.length;

                                return (
                                    <GlassCard
                                        key={project.id}
                                        className="!p-0 overflow-hidden cursor-pointer hover:bg-white/35 hover:-translate-y-1 animate-fade-in-up group"
                                        style={
                                            {
                                                animationDelay: `${0.1 + i * 0.05}s`,
                                                animationFillMode: "backwards",
                                            } as any
                                        }
                                        onClick={() => navigate(`/projects/${project.id}`)}
                                    >
                                        <div
                                            className={`h-1.5 bg-gradient-to-r ${ACCENT_GRADIENTS[i % ACCENT_GRADIENTS.length]}`}
                                        />
                                        <div className="p-5">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <h2 className="font-bold text-gray-900 leading-tight group-hover:text-pink-600 transition">
                                                    {project.title}
                                                </h2>
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    <span
                                                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${isOwner
                                                            ? "bg-pink-100 text-pink-700 border-pink-200"
                                                            : "bg-orange-100 text-orange-700 border-orange-200"
                                                            }`}
                                                    >
                                                        {isOwner ? "Propriétaire" : "Participant"}
                                                    </span>
                                                    {isOwner && (
                                                        <button
                                                            onClick={(e) => handleDelete(e, project.id)}
                                                            className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50/60 transition text-xs"
                                                            title="Supprimer le projet"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <p className="text-gray-600 text-sm line-clamp-2 mb-4 leading-relaxed">
                                                {project.description}
                                            </p>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex -space-x-1.5">
                                                        {allMembers.slice(0, 4).map((m) => (
                                                            <Avatar key={m.id} name={m.name} size="xs" />
                                                        ))}
                                                        {memberCount > 4 && (
                                                            <div className="w-6 h-6 rounded-full bg-white/70 border border-white/80 text-[10px] text-gray-500 font-bold flex items-center justify-center ring-2 ring-white/60">
                                                                +{memberCount - 4}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-500">
                                                        {memberCount} membre{memberCount > 1 ? "s" : ""}
                                                    </span>
                                                </div>
                                                <span className="text-xs font-medium text-pink-500 group-hover:text-pink-600 transition">
                                                    Ouvrir →
                                                </span>
                                            </div>
                                        </div>
                                    </GlassCard>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {confirmProjectId && (
                <ConfirmDialog
                    message="Supprimer ce projet et toutes ses tâches ?"
                    onConfirm={confirmDeleteProject}
                    onCancel={() => setConfirmProjectId(null)}
                />
            )}
        </PageBackground>
    );
}
