import { ReactNode, CSSProperties } from "react";

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
    onClick?: () => void;
}

export default function GlassCard({ children, className = "", style, onClick }: GlassCardProps) {
    return (
        <div
            onClick={onClick}
            style={style}
            className={`relative bg-white/25 backdrop-blur-2xl saturate-150 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/70 transition-all duration-300 ${className}`}
        >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent rounded-t-3xl" />
            {children}
        </div>
    );
}