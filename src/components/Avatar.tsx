interface AvatarProps {
    name: string;
    size?: "xs" | "sm" | "md";
}

export default function Avatar({ name, size = "sm" }: AvatarProps) {
    const initials = name
        .split(" ")
        .map((w) => w[0] ?? "")
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const sizes = {
        xs: "w-6 h-6 text-[10px]",
        sm: "w-8 h-8 text-xs",
        md: "w-10 h-10 text-sm",
    };

    return (
        <div
            title={name}
            className={`${sizes[size]} rounded-full bg-gradient-to-br from-pink-400 to-orange-400 text-white font-bold flex items-center justify-center flex-shrink-0 ring-2 ring-white/70`}
        >
            {initials}
        </div>
    );
}
