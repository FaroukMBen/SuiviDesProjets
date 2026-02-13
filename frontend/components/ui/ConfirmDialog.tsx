'use client';
import React, { useState, createContext, useContext, useCallback, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType>({
    confirm: () => Promise.resolve(false),
});

export function useConfirm() {
    return useContext(ConfirmContext);
}

const typeStyles = {
    danger: {
        icon: 'bg-red-100 text-red-600',
        button: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
        icon: 'bg-amber-100 text-amber-600',
        button: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    info: {
        icon: 'bg-blue-100 text-blue-600',
        button: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
};

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({
        title: '',
        message: '',
        type: 'info',
    });
    const resolveRef = useRef<(value: boolean) => void>(() => { });

    const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
        setOptions(opts);
        setIsOpen(true);
        return new Promise<boolean>(resolve => {
            resolveRef.current = resolve;
        });
    }, []);

    const handleConfirm = () => {
        setIsOpen(false);
        resolveRef.current(true);
    };

    const handleCancel = () => {
        setIsOpen(false);
        resolveRef.current(false);
    };

    const type = options.type || 'info';
    const styles = typeStyles[type];

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}

            {/* Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[9998] flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={handleCancel}
                        style={{ animation: 'fadeIn 0.2s ease-out' }}
                    />

                    {/* Modale */}
                    <div
                        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
                        style={{ animation: 'scaleIn 0.2s ease-out' }}
                    >
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${styles.icon}`}>
                                    <AlertTriangle size={20} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900">{options.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{options.message}</p>
                                </div>
                                <button onClick={handleCancel} className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                {options.cancelText || 'Annuler'}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`px-4 py-2 text-sm font-bold rounded-lg transition ${styles.button}`}
                            >
                                {options.confirmText || 'Confirmer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
        </ConfirmContext.Provider>
    );
}
