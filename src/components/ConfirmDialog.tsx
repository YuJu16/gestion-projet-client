import GlassCard from "./GlassCard";
import Button from "./Button";

interface ConfirmDialogProps {
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    message,
    confirmLabel = "Supprimer",
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
            onClick={onCancel}
        >
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm animate-dialog-in">
                <GlassCard className="!p-6">
                    <p className="text-gray-900 font-medium text-sm mb-5">{message}</p>
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={onCancel} className="!py-2 !px-4 text-sm">
                            Annuler
                        </Button>
                        <Button
                            onClick={onConfirm}
                            className="!py-2 !px-4 text-sm !bg-none !bg-red-500 hover:!bg-red-600 !shadow-red-300/50"
                        >
                            {confirmLabel}
                        </Button>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
