import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Download } from 'lucide-react';

interface SyncModalProps {
  isOpen: boolean;
}

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-[var(--card)] rounded-3xl shadow-2xl p-8 text-center border border-[var(--card-border)]"
          >
            <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-500 mx-auto mb-6 relative">
              <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
              <Download size={32} />
            </div>
            
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              একটু অপেক্ষা করুন
            </h2>
            
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              শিক্ষক, শিক্ষার্থী এবং অন্যান্য তথ্যগুলো ডাউনলোড হতে কিছুক্ষণ সময় প্রয়োজন। ডাউনলোড হলে ইন্টারনেট ছাড়াই তথ্যগুলো ব্যবহার করা যাবে।
            </p>
            
            <div className="flex items-center justify-center gap-3 text-orange-500 font-bold text-sm">
              <Loader2 size={18} className="animate-spin" />
              <span>ডাউনলোড হচ্ছে...</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
