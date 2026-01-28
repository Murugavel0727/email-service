import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ type = 'info', message, onClose, duration = 4000 }) => {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const icons = {
        success: CheckCircle,
        error: XCircle,
        warning: AlertCircle,
        info: Info,
    };

    const styles = {
        success: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300',
        error: 'bg-red-500/20 border-red-500/50 text-red-300',
        warning: 'bg-amber-500/20 border-amber-500/50 text-amber-300',
        info: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
    };

    const iconStyles = {
        success: 'text-emerald-400',
        error: 'text-red-400',
        warning: 'text-amber-400',
        info: 'text-blue-400',
    };

    const Icon = icons[type];

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-elevation-lg min-w-[300px] max-w-md ${styles[type]}`}
        >
            <Icon size={20} className={`shrink-0 mt-0.5 ${iconStyles[type]}`} />
            <p className="flex-1 text-sm leading-relaxed text-white">{message}</p>
            <button
                onClick={onClose}
                className="shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
            >
                <X size={16} className="text-white/70" />
            </button>
        </motion.div>
    );
};

export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        type={toast.type}
                        message={toast.message}
                        duration={toast.duration}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

export default Toast;
