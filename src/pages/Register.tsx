import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import PageBackground from "../components/PageBackground";
import GlassCard from "../components/GlassCard";
import Button from "../components/Button";

export default function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await api.post("/auth/register", { name, email, password });
            login(res.data.token, res.data.user);
            navigate("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.error || "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    }

    return (
        <PageBackground>
            <div className="min-h-screen flex items-center justify-center p-8">
                <GlassCard className="w-full max-w-md animate-fade-in-up">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Créer un compte</h1>
                    <p className="text-gray-700 mb-8">Rejoins la plateforme en quelques secondes</p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <input
                            type="text"
                            placeholder="Nom"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="px-4 py-3 rounded-xl bg-white/50 border border-white/60 placeholder-gray-500 text-gray-900 outline-none focus:bg-white/70 transition"
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="px-4 py-3 rounded-xl bg-white/50 border border-white/60 placeholder-gray-500 text-gray-900 outline-none focus:bg-white/70 transition"
                        />
                        <input
                            type="password"
                            placeholder="Mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="px-4 py-3 rounded-xl bg-white/50 border border-white/60 placeholder-gray-500 text-gray-900 outline-none focus:bg-white/70 transition"
                        />

                        {error && <p className="text-red-600 text-sm">{error}</p>}

                        <Button type="submit" disabled={loading} className="mt-2">
                            {loading ? "Création..." : "S'inscrire"}
                        </Button>
                    </form>

                    <p className="text-gray-700 text-sm mt-6 text-center">
                        Déjà un compte ?{" "}
                        <Link to="/login" className="text-pink-600 font-medium hover:underline">
                            Se connecter
                        </Link>
                    </p>
                </GlassCard>
            </div>
        </PageBackground>
    );
}