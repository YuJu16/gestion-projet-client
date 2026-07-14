function App() {
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at 15% 20%, #fda4af 0%, transparent 45%),
          radial-gradient(circle at 85% 10%, #fdba74 0%, transparent 50%),
          radial-gradient(circle at 50% 60%, #f0abfc 0%, transparent 55%),
          radial-gradient(circle at 90% 80%, #fecdd3 0%, transparent 50%),
          #fff7ed
        `,
      }}
    >
      {/* grain léger pour donner de la texture au fond, comme dans l'inspiration */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center gap-8 p-8">
        <h1 className="text-5xl font-bold text-gray-900 tracking-wide animate-fade-in-up">
          Gestion de projet
        </h1>

        <div
          className="relative bg-white/25 backdrop-blur-2xl saturate-150 rounded-3xl p-8 w-full max-w-md shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/70 animate-fade-in-up transition-all duration-300 hover:bg-white/35 hover:-translate-y-1"
          style={{ animationDelay: "0.15s", animationFillMode: "backwards" }}
        >
          {/* reflet lumineux en haut de la card, effet verre */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent rounded-t-3xl" />

          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Refonte du site vitrine</h2>
          <p className="text-gray-700 mb-6">Projet de test pour valider le design</p>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-white/50 backdrop-blur-sm border border-white/60 text-pink-700 rounded-full text-sm font-medium">
              En cours
            </span>
            <span className="px-3 py-1 bg-white/50 backdrop-blur-sm border border-white/60 text-orange-700 rounded-full text-sm font-medium">
              3 tâches
            </span>
          </div>
        </div>

        <button
          className="bg-gradient-to-r from-pink-500 to-orange-400 text-white px-8 py-3 rounded-full font-medium shadow-lg shadow-pink-300/50 transition-all duration-300 hover:shadow-xl hover:shadow-pink-300/60 hover:scale-105 active:scale-95 animate-fade-in-up"
          style={{ animationDelay: "0.3s", animationFillMode: "backwards" }}
        >
          Nouveau projet
        </button>
      </div>
    </div>
  );
}

export default App;