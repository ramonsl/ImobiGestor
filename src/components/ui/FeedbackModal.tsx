"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, XCircle, Info } from "lucide-react"

type FeedbackType = 'success' | 'error' | 'warning' | 'info'

interface FeedbackModalProps {
    isOpen: boolean
    onClose: () => void
    type: FeedbackType
    title: string
    message: string
    onConfirm?: () => void
    confirmLabel?: string
}

const icons: Record<FeedbackType, React.ReactNode> = {
    success: <CheckCircle className="h-12 w-12 text-emerald-500" />,
    error: <XCircle className="h-12 w-12 text-red-500" />,
    warning: <AlertCircle className="h-12 w-12 text-amber-500" />,
    info: <Info className="h-12 w-12 text-blue-500" />
}

const colors: Record<FeedbackType, string> = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500'
}

export function FeedbackModal({
    isOpen,
    onClose,
    type,
    title,
    message,
    onConfirm,
    confirmLabel = "OK"
}: FeedbackModalProps) {
    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm()
        }
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#1a1f3a] border-zinc-800 text-white max-w-md">
                <DialogHeader>
                    <div className="flex flex-col items-center text-center pt-4">
                        {icons[type]}
                        <DialogTitle className={`text-xl font-semibold mt-4 ${colors[type]}`}>
                            {title}
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="text-center text-zinc-300 py-4">
                    {message}
                </div>

                <DialogFooter className="flex justify-center">
                    <Button
                        onClick={handleConfirm}
                        className={type === 'success'
                            ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                            : type === 'error'
                                ? "bg-red-500 hover:bg-red-600 text-white"
                                : "bg-zinc-600 hover:bg-zinc-700 text-white"
                        }
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
