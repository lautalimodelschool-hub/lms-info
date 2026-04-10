import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

interface AlertContextType {
  showAlert: (message: string) => void;
  showConfirm: (message: string, onConfirm: () => void) => void;
  showToast: (message: string, type?: 'info' | 'success' | 'warning') => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isConfirm, setIsConfirm] = useState(false);
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void) | null>(null);

  const [toasts, setToasts] = useState<{ id: string; message: string; type: string }[]>([]);

  const showAlert = useCallback((msg: string) => {
    setMessage(msg);
    setIsConfirm(false);
    setOnConfirmCallback(null);
    setIsOpen(true);
  }, []);

  const showConfirm = useCallback((msg: string, onConfirm: () => void) => {
    setMessage(msg);
    setIsConfirm(true);
    setOnConfirmCallback(() => onConfirm);
    setIsOpen(true);
  }, []);

  const showToast = useCallback((msg: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message: msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const closeAlert = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleConfirm = useCallback(() => {
    if (onConfirmCallback) onConfirmCallback();
    setIsOpen(false);
  }, [onConfirmCallback]);

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm, showToast }}>
      {children}
      
      {/* Toasts */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[110] w-full max-w-xs space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "mx-4 p-4 rounded-2xl shadow-lg border flex items-center gap-3 pointer-events-auto",
                toast.type === 'success' ? "bg-green-500 text-white border-green-600" :
                toast.type === 'warning' ? "bg-amber-500 text-white border-amber-600" :
                "bg-slate-900 text-white border-slate-800"
              )}
            >
              <AlertCircle size={20} />
              <span className="text-sm font-bold">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAlert}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-6 text-center">
                <div className={`w-16 h-16 ${isConfirm ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-500' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-500'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  {isConfirm ? <HelpCircle size={32} /> : <AlertCircle size={32} />}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {isConfirm ? t('confirm', 'Confirm') : t('attention', 'Attention')}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  {message}
                </p>
                <div className="flex gap-3">
                  {isConfirm && (
                    <button
                      onClick={closeAlert}
                      className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold transition-colors active:scale-95"
                    >
                      {t('cancel', 'Cancel')}
                    </button>
                  )}
                  <button
                    onClick={isConfirm ? handleConfirm : closeAlert}
                    className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold transition-colors active:scale-95"
                  >
                    {isConfirm ? t('yes', 'Yes') : t('ok', 'OK')}
                  </button>
                </div>
              </div>
              <button
                onClick={closeAlert}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
