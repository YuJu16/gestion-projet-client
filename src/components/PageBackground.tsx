import { ReactNode } from "react";

export default function PageBackground({ children }: { children: ReactNode }) {
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
            <div
                className="absolute inset-0 opacity-[0.03] mix-blend-multiply pointer-events-none"
                style={{
                    backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)'/%3E%3C/svg%3E\")",
                }}
            />
            <div className="relative z-10">{children}</div>
        </div>
    );
}