import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import PageBackground from "../components/PageBackground";
import GlassCard from "../components/GlassCard";
import Button from "../components/Button";

interface Project {
    id: string;
    title: string;
    description: string;
    owner: { id: string; name: string; email: string };
    participants: { user: { id: string; name: string } }[];
}

export default function Dashboard() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");

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

    async function handleDelete(e: React.MouseEvent, projectId: string) {
        e.stopPropagation();

        if (!confirm("Supprimer ce projet et toutes ses tâches ?")) return;

        try {
            await api.delete(`/projects/${projectId}`);
            fetchProjects();
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <PageBackground>
            <div className="min-h-screen p-8 max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-10 animate-fade-in-up">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 tracking-wide">Mes projets</h1>
                        <p className="text-gray-700 mt-1">Bienvenue {user?.name}</p>
                    </div>
                    <Button variant="secondary" onClick={logout}>
                        Déconnexion
                    </Button>
                </div>

                <div
                    className="mb-8 animate-fade-in-up"
                    style={{ animationDelay: "0.1s", animationFillMode: "backwards" }}
                >
                    <Button onClick={() => setShowForm(!showForm)}>
                        {showForm ? "Annuler" : "+ Nouveau projet"}
                    </Button>
                </div>

                {showForm && (
                    <GlassCard className="mb-8 animate-fade-in-up">
                        <form onSubmit={handleCreate} className="flex flex-col gap-4">
                            <input
                                type="text"
                                placeholder="Titre du projet"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="px-4 py-3 rounded-xl bg-white/50 border border-white/60 placeholder-gray-500 text-gray-900 outline-none focus:bg-white/70 transition"
                            />
                            <textarea
                                placeholder="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                rows={3}
                                className="px-4 py-3 rounded-xl bg-white/50 border border-white/60 placeholder-gray-500 text-gray-900 outline-none focus:bg-white/70 transition resize-none"
                            />
                            {error && <p className="text-red-600 text-sm">{error}</p>}
                            <Button type="submit">Créer le projet</Button>
                        </form>
                    </GlassCard>
                )}

                {loading ? (
                    <p className="text-gray-700">Chargement...</p>
                ) : projects.length === 0 ? (
                    <p className="text-gray-700">Aucun projet pour l'instant. Crée le premier !</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {projects.map((project, i) => (
                            <GlassCard
                                key={project.id}
                                className="cursor-pointer hover:bg-white/35 hover:-translate-y-1 animate-fade-in-up"
                                style={{ animationDelay: `${0.15 + i * 0.05}s`, animationFillMode: "backwards" } as any}
                            >
                                <div onClick={() => navigate(`/projects/${project.id}`)}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h2 className="text-xl font-semibold text-gray-900">{project.title}</h2>
                                        {project.owner.id === user?.id && (
                                            <button
                                                onClick={(e) => handleDelete(e, project.id)}
                                                className="text-gray-500 hover:text-red-600 text-sm transition"
                                                title="Supprimer le projet"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-gray-700 mb-4 line-clamp-2">{project.description}</p>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <span className="px-3 py-1 bg-white/50 backdrop-blur-sm border border-white/60 rounded-full">
                                            {project.participants.length + 1} membre{project.participants.length > 0 ? "s" : ""}
                                        </span>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                )}
            </div>
        </PageBackground>
    );
}