import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: "primary" | "secondary";
}

export default function Button({ children, variant = "primary", className = "", ...props }: ButtonProps) {
    const base = "px-6 py-3 rounded-full font-medium transition-all duration-300 active:scale-95";

    const variants = {
        primary:
            "bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-lg shadow-pink-300/50 hover:shadow-xl hover:shadow-pink-300/60 hover:scale-105",
        secondary:
            "bg-white/50 backdrop-blur-sm border border-white/60 text-gray-800 hover:bg-white/70",
    };

    return (
        <button className={`${base} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
}