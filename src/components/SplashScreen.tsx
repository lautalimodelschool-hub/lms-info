import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [imageError, setImageError] = useState(false);
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 800); // Wait for exit animation
    }, 2800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 overflow-hidden"
        >
          {/* Decorative Background Elements */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500/20 dark:bg-orange-500/10 blur-[100px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 dark:bg-blue-500/10 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center relative z-10"
          >
            <motion.div
              animate={{ 
                y: [0, -10, 0],
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative mb-8"
            >
              <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full scale-150" />
              {!imageError ? (
                <img 
                  src="/logo.png" 
                  alt="School Logo" 
                  className="w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-2xl relative z-10"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/40 relative z-10">
                  <GraduationCap size={64} className="text-white" />
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-center space-y-2"
            >
              <h1 className={isBn 
                ? "text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-400 tracking-tight"
                : "text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight"
              }>
                {isBn ? 'লাউতলী মডেল স্কুল' : 'LAUTOLI MODEL SCHOOL'}
              </h1>
              <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 tracking-[0.2em] uppercase mt-2">
                {isBn ? 'ফরিদগঞ্জ, চাঁদপুর' : 'FARIDGANJ, CHANDPUR'}
              </p>
            </motion.div>

            {/* Loading Progress Bar */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-12 w-48 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden"
            >
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
