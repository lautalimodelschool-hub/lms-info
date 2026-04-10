import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flag, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAlert } from '../context/AlertContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'student' | 'employee';
  entityName: string;
  entityId: string;
  reporterId: string;
  reporterName: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityName,
  entityId,
  reporterId,
  reporterName,
}) => {
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useAlert();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('Please enter a description', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('reports').insert([{
        reporter_id: reporterId,
        reporter_name: reporterName,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        description: description.trim(),
        status: 'pending'
      }]);

      if (error) throw error;

      showToast('Report submitted successfully', 'success');
      setDescription('');
      onClose();
    } catch (err: any) {
      console.error('Report error:', err);
      showToast(`Failed to submit report: ${err.message}`, 'warning');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[var(--card)] rounded-3xl shadow-2xl overflow-hidden border border-[var(--card-border)]"
          >
            <div className="p-6 border-b border-[var(--card-border)] flex justify-between items-center bg-[var(--secondary)]/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
                  <Flag size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Report Wrong Info</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Reporting {entityName}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[var(--card)] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shadow-sm border border-[var(--card-border)]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  What information is wrong?
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="E.g., The phone number is incorrect, or the name is misspelled..."
                  className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500/20 min-h-[120px] resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-[var(--secondary)] text-slate-600 dark:text-slate-300 rounded-xl font-bold transition-colors active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Submit Report'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
