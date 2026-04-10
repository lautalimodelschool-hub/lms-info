import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Download, Plus, Search, Filter, X, Upload, Loader2, CheckCircle2, Folder, ChevronLeft, Calendar, Trash2, ChevronRight, BookOpen, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { LessonPlan } from '../types';
import { useAlert } from '../context/AlertContext';
import { cn } from '../lib/utils';
import { get, set } from 'idb-keyval';

const CLASSES = ['Play', 'Nursery', 'Pre-One', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

const CLASS_SUBJECTS: Record<string, string[]> = {
  'Play': ['Word Book & অংকন', 'ইংরেজি', 'গণিত', 'ধর্ম', 'বাংলা'],
  'Nursery': ['Word Book & অংকন', 'ইংরেজি', 'গণিত', 'ধর্ম', 'বাংলা'],
  'Pre-One': ['Word Book & অংকন', 'ইংরেজি', 'গণিত', 'ধর্ম', 'বাংলা'],
  'One': ['Word Book & অংকন', 'ইংরেজি', 'গণিত', 'ধর্ম', 'বাংলা', 'সাধারণ জ্ঞান'],
  'Two': ['Word Book & অংকন', 'ইংরেজি', 'গণিত', 'ধর্ম', 'বাংলা', 'সাধারণ জ্ঞান'],
  'Three': ['অংকন', 'ইংরেজি ১ম পত্র', 'ইংরেজি ২য় পত্র', 'গণিত', 'ধর্ম', 'বাওবি', 'বাংলা ১ম পত্র', 'বাংলা ২য় পত্র', 'বিজ্ঞান', 'সাধারণ জ্ঞান'],
  'Four': ['অংকন', 'ইংরেজি ১ম পত্র', 'ইংরেজি ২য় পত্র', 'গণিত', 'ধর্ম', 'বাওবি', 'বাংলা ১ম পত্র', 'বাংলা ২য় পত্র', 'বিজ্ঞান', 'সাধারণ জ্ঞান'],
  'Five': ['অংকন', 'ইংরেজি ১ম পত্র', 'ইংরেজি ২য় পত্র', 'গণিত', 'ধর্ম', 'বাওবি', 'বাংলা ১ম পত্র', 'বাংলা ২য় পত্র', 'বিজ্ঞান', 'সাধারণ জ্ঞান'],
  'Six': ['ইংরেজি ১ম পত্র', 'ইংরেজি ২য় পত্র', 'গণিত', 'তথ্য', 'ধর্ম', 'বাওবি', 'বাংলা ১ম পত্র', 'বাংলা ২য় পত্র', 'বিজ্ঞান'],
  'Seven': ['ইংরেজি ১ম পত্র', 'ইংরেজি ২য় পত্র', 'গণিত', 'তথ্য', 'ধর্ম', 'বাওবি', 'বাংলা ১ম পত্র', 'বাংলা ২য় পত্র', 'বিজ্ঞান'],
  'Eight': ['ইংরেজি ১ম পত্র', 'ইংরেজি ২য় পত্র', 'গণিত', 'তথ্য', 'ধর্ম', 'বাওবি', 'বাংলা ১ম পত্র', 'বাংলা ২য় পত্র', 'বিজ্ঞান'],
  'Nine': ['ইংরেজি ১ম পত্র', 'ইংরেজি ২য় পত্র', 'গণিত', 'তথ্য', 'বাংলা ১ম পত্র', 'বাংলা ২য় পত্র', 'বিজ্ঞান গ্রুপের বিষয়', 'মানবিক গ্রুপের বিষয়'],
  'Ten': ['ইংরেজি ১ম পত্র', 'ইংরেজি ২য় পত্র', 'গণিত', 'তথ্য', 'বাংলা ১ম পত্র', 'বাংলা ২য় পত্র', 'বিজ্ঞান গ্রুপের বিষয়', 'মানবিক গ্রুপের বিষয়'],
};

export const LessonPlans: React.FC<{ user: any }> = ({ user }) => {
  const { t } = useTranslation();
  const { showAlert } = useAlert();
  const [lessons, setLessons] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [rejectingLessonId, setRejectingLessonId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject_name: CLASS_SUBJECTS['Play'][0],
    class_id: CLASSES[0],
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Update subject when class changes
  useEffect(() => {
    if (formData.class_id) {
      setFormData(prev => ({
        ...prev,
        subject_name: CLASS_SUBJECTS[formData.class_id][0] || ''
      }));
    }
  }, [formData.class_id]);

  const fetchLessons = async () => {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn("Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const cacheKey = `lesson_plans_${user.role}`;

    // Try loading from cache first
    try {
      const cachedData = await get(cacheKey);
      if (cachedData) {
        setLessons(cachedData);
      }
    } catch (e) {
      console.error("Failed to load lessons from cache", e);
    }

    try {
      let query = supabase
        .from('lesson_plans')
        .select('*')
        .order('created_at', { ascending: false });

      // Students should only see approved lesson plans
      if (user.role === 'student') {
        query = query.eq('status', 'approved');
      }

      const { data, error } = await query;
      
      if (!error && data) {
        setLessons(data);
        // Save to cache
        await set(cacheKey, data);
      } else if (error) {
        console.error("Error fetching lessons:", error);
      }
    } catch (err) {
      console.error("Failed to fetch lessons:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const [rlsError, setRlsError] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      showAlert('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setRlsError(false);
    try {
      // 1. Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `lessons/${fileName}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('lesson-plans')
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          throw new Error('The "lesson-plans" storage bucket does not exist. Please create a public bucket named "lesson-plans" in your Supabase Storage dashboard.');
        }
        if (uploadError.message.includes('row-level security') || uploadError.message.includes('RLS')) {
          setRlsError(true);
          throw new Error('RLS_ERROR');
        }
        throw uploadError;
      }

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('lesson-plans')
        .getPublicUrl(filePath);

      // 3. Insert into database
      const { error: insertError } = await supabase
        .from('lesson_plans')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            subject_name: formData.subject_name,
            class_id: formData.class_id,
            teacher_id: user.id,
            file_url: publicUrl,
            file_type: fileExt || 'pdf',
            status: 'pending',
            start_date: formData.start_date,
            end_date: formData.end_date,
          }
        ]);

      if (insertError) {
        if (insertError.message.includes('row-level security') || insertError.message.includes('RLS')) {
          setRlsError(true);
          throw new Error('RLS_ERROR');
        }
        throw insertError;
      }

      showAlert('Lesson plan submitted for approval!');
      setShowUploadModal(false);
      setFormData({ 
        title: '', 
        description: '', 
        subject_name: CLASS_SUBJECTS['Play'][0], 
        class_id: CLASSES[0],
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      setFile(null);
      fetchLessons();
    } catch (err: any) {
      console.error("Upload error:", err);
      if (err.message !== 'RLS_ERROR') {
        showAlert(`Upload failed: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lesson_plans')
        .update({ status: 'approved' })
        .eq('id', id);
      
      if (error) throw error;
      showAlert('Lesson plan approved!');
      fetchLessons();
    } catch (err: any) {
      showAlert(`Failed to approve: ${err.message}`);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingLessonId || !rejectionReason.trim()) return;
    
    try {
      const { error } = await supabase
        .from('lesson_plans')
        .update({ 
          status: 'rejected', 
          rejection_reason: rejectionReason 
        })
        .eq('id', rejectingLessonId);
      
      if (error) throw error;
      showAlert('Lesson plan rejected.');
      setRejectingLessonId(null);
      setRejectionReason('');
      fetchLessons();
    } catch (err: any) {
      showAlert(`Failed to reject: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (!deletingLessonId) return;
    
    try {
      // Optional: Try to delete the file from storage if possible
      const lesson = lessons.find(l => l.id === deletingLessonId);
      if (lesson && lesson.file_url) {
        const filePathMatch = lesson.file_url.match(/lesson-plans\/(.+)$/);
        if (filePathMatch && filePathMatch[1]) {
          await supabase.storage.from('lesson-plans').remove([filePathMatch[1]]);
        }
      }

      const { error } = await supabase
        .from('lesson_plans')
        .delete()
        .eq('id', deletingLessonId);
      
      if (error) throw error;
      showAlert('Lesson plan deleted successfully.');
      fetchLessons();
    } catch (err: any) {
      showAlert(`Failed to delete: ${err.message}`);
    } finally {
      setDeletingLessonId(null);
    }
  };

  const { showToast } = useAlert();

  const handleDownload = async (e: React.MouseEvent, url: string, title: string) => {
    e.preventDefault();

    if (!window.navigator.onLine) {
      showToast(t('offlineError'), 'warning');
      return;
    }

    showToast(t('downloading'), 'info');

    try {
      // Try to fetch and download as blob to prevent opening new tab
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      
      // Extract extension from url or default to .pdf
      const extMatch = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
      const ext = extMatch ? `.${extMatch[1]}` : '.pdf';
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}${ext}`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed, falling back to direct link', error);
      // Fallback: append ?download= to force download if it's a supabase URL
      const downloadUrl = url.includes('supabase.co') ? `${url}?download=` : url;
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = title;
      a.target = '_top'; // Use _top instead of _blank to avoid new tab if possible
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const filteredLessons = lessons.filter(l => 
    (selectedClass ? l.class_id === selectedClass : true) &&
    (selectedSubject ? l.subject_name === selectedSubject : true) &&
    (l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.subject_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
            {t('lessonPlans')}
          </h1>
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            <button 
              onClick={() => { setSelectedClass(null); setSelectedSubject(null); }}
              className={`hover:text-orange-500 transition-colors ${!selectedClass ? 'text-orange-500 font-bold' : ''}`}
            >
              Classes
            </button>
            {selectedClass && (
              <>
                <ChevronRight size={14} className="opacity-50" />
                <button 
                  onClick={() => setSelectedSubject(null)}
                  className={`hover:text-orange-500 transition-colors ${!selectedSubject ? 'text-orange-500 font-bold' : ''}`}
                >
                  Class {selectedClass}
                </button>
              </>
            )}
            {selectedSubject && (
              <>
                <ChevronRight size={14} className="opacity-50" />
                <span className="text-orange-500 font-bold">{selectedSubject}</span>
              </>
            )}
          </div>
        </div>

        {(user.role === 'admin' || user.role === 'teacher') && (
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowUploadModal(true)}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-3 rounded-2xl shadow-lg shadow-orange-500/25 flex items-center gap-2 font-bold transition-all hover:shadow-orange-500/40"
          >
            <Plus size={20} />
            <span>Upload Plan</span>
          </motion.button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400 group-focus-within:text-orange-500 transition-colors" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or subject..."
            className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white transition-all"
          />
        </div>
        <button className="w-14 h-14 bg-white dark:bg-slate-800/50 rounded-2xl flex items-center justify-center text-slate-500 hover:text-orange-500 shadow-sm border border-slate-200 dark:border-slate-700/50 transition-colors">
          <Filter size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 size={32} className="animate-spin text-orange-500 mb-4" />
            <p className="font-medium">Loading lesson plans...</p>
          </div>
        ) : !selectedClass && !searchQuery ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {CLASSES.map((className, idx) => {
              const count = lessons.filter(l => l.class_id === className).length;
              return (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={className}
                  onClick={() => setSelectedClass(className)}
                  className="bg-white dark:bg-slate-800/50 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700/50 flex flex-col items-center justify-center gap-4 transition-all hover:shadow-md hover:border-orange-300/50 dark:hover:border-orange-500/30 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform duration-300">
                    <Folder size={32} fill="currentColor" className="opacity-20" />
                    <Folder size={32} className="absolute" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">Class {className}</h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full inline-block">{count} lessons</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        ) : selectedClass && !selectedSubject && !searchQuery ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(CLASS_SUBJECTS[selectedClass] || []).map((subjectName, idx) => {
              const count = lessons.filter(l => l.class_id === selectedClass && l.subject_name === subjectName).length;
              return (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={subjectName}
                  onClick={() => setSelectedSubject(subjectName)}
                  className="bg-white dark:bg-slate-800/50 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700/50 flex flex-col items-center justify-center gap-4 transition-all hover:shadow-md hover:border-blue-300/50 dark:hover:border-blue-500/30 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen size={28} />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2">{subjectName}</h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full inline-block">{count} lessons</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        ) : filteredLessons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLessons.map((lesson, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={lesson.id}
                className="bg-white dark:bg-slate-800/50 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700/50 hover:shadow-md transition-all relative overflow-hidden group flex flex-col"
              >
                {/* Status Top Border */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  lesson.status === 'approved' ? 'bg-green-500' : 
                  lesson.status === 'rejected' ? 'bg-red-500' : 
                  'bg-yellow-500'
                }`} />

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      lesson.status === 'approved' ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 
                      lesson.status === 'rejected' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 
                      'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20'
                    }`}>
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight mb-1 group-hover:text-orange-500 transition-colors">{lesson.title}</h3>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{lesson.subject_name}</span>
                        <span>•</span>
                        <span>Class {lesson.class_id}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {lesson.start_date && lesson.end_date && (
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 mb-4 bg-slate-50 dark:bg-slate-800/80 w-fit px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <Calendar size={14} className="text-orange-500" />
                    <span>{new Date(lesson.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="text-slate-400">→</span>
                    <span>{new Date(lesson.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                )}

                {lesson.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2 flex-1">
                    {lesson.description}
                  </p>
                )}
                
                {lesson.status === 'rejected' && lesson.rejection_reason && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl">
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1 flex items-center gap-1">
                      <X size={12} /> Rejection Reason
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300">{lesson.rejection_reason}</p>
                  </div>
                )}

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      lesson.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                      lesson.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {lesson.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(lesson.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {user.role === 'admin' && (
                      <button 
                        onClick={() => setDeletingLessonId(lesson.id)}
                        className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    {user.role === 'admin' && lesson.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleApprove(lesson.id)}
                          className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                          title="Approve"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <button 
                          onClick={() => setRejectingLessonId(lesson.id)}
                          className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                          title="Reject"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                    <button 
                      onClick={(e) => handleDownload(e, lesson.file_url, lesson.title)}
                      className="flex items-center gap-2 bg-slate-900 dark:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform"
                    >
                      <Download size={14} />
                      Download
                    </button>
                  </div>
                </div>
            </motion.div>
          ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800/50 rounded-3xl p-12 border border-slate-200 dark:border-slate-700/50 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <FileText size={32} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No lesson plans found</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              {searchQuery 
                ? "We couldn't find any lesson plans matching your search." 
                : "There are no lesson plans available in this folder yet."}
            </p>
            {(user.role === 'admin' || user.role === 'teacher') && !searchQuery && (
              <button 
                onClick={() => setShowUploadModal(true)}
                className="mt-6 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 px-6 py-2.5 rounded-xl font-bold hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors"
              >
                Upload the first one
              </button>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !uploading && setShowUploadModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[var(--card)] rounded-[2.5rem] shadow-2xl border border-[var(--card-border)] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-[var(--card-border)] flex items-center justify-between shrink-0">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Upload Lesson Plan</h2>
                <button 
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                  className="w-10 h-10 rounded-full bg-[var(--secondary)] flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Title</label>
                    <input 
                      type="text" 
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Algebra Introduction"
                      className="w-full bg-[var(--secondary)] border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-orange-500/20 dark:text-white text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Subject</label>
                    <select 
                      required
                      value={formData.subject_name}
                      onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                      className="w-full bg-[var(--secondary)] border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-orange-500/20 dark:text-white text-sm appearance-none"
                    >
                      {(CLASS_SUBJECTS[formData.class_id] || []).map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Class</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {CLASSES.map((className) => (
                        <button
                          key={className}
                          type="button"
                          onClick={() => setFormData({ ...formData, class_id: className })}
                          className={cn(
                            "py-2 px-3 rounded-xl text-sm font-medium transition-all border",
                            formData.class_id === className
                              ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20"
                              : "bg-[var(--secondary)] text-slate-600 dark:text-slate-300 border-transparent hover:border-orange-200"
                          )}
                        >
                          {className}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">From Date</label>
                      <input 
                        type="date" 
                        required
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="w-full bg-[var(--secondary)] border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-orange-500/20 dark:text-white text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">To Date</label>
                      <input 
                        type="date" 
                        required
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="w-full bg-[var(--secondary)] border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-orange-500/20 dark:text-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Description <span className="text-slate-400 font-normal lowercase">(Optional)</span></label>
                    <textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief overview of the lesson..."
                      rows={3}
                      className="w-full bg-[var(--secondary)] border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-orange-500/20 dark:text-white text-sm resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">File (PDF/Image)</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "w-full h-32 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
                        file 
                          ? "border-green-500 bg-green-50/30 dark:bg-green-900/10" 
                          : "border-[var(--card-border)] bg-[var(--secondary)] hover:border-orange-500/50"
                      )}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,image/*"
                      />
                      {file ? (
                        <>
                          <CheckCircle2 className="text-green-500" size={32} />
                          <span className="text-xs font-bold text-green-600 dark:text-green-400 truncate max-w-[200px]">
                            {file.name}
                          </span>
                        </>
                      ) : (
                        <>
                          <Upload className="text-slate-400" size={32} />
                          <span className="text-xs font-bold text-slate-500">Tap to select file</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={uploading || !file}
                    className="w-full bg-orange-500 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70 disabled:active:scale-100 shadow-lg shadow-orange-500/20 mt-4"
                  >
                    {uploading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>Submit for Approval</>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Rejection Modal */}
      <AnimatePresence>
        {rejectingLessonId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRejectingLessonId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[var(--card)] rounded-3xl shadow-2xl border border-[var(--card-border)] overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--card-border)] flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Reject Lesson Plan</h2>
                <button 
                  onClick={() => setRejectingLessonId(null)}
                  className="w-8 h-8 rounded-full bg-[var(--secondary)] flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleReject} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Reason for Rejection</label>
                  <textarea 
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason..."
                    rows={3}
                    className="w-full bg-[var(--secondary)] border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-red-500/20 dark:text-white text-sm resize-none"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={!rejectionReason.trim()}
                  className="w-full bg-red-500 text-white rounded-2xl py-3 font-bold active:scale-95 transition-transform disabled:opacity-70 disabled:active:scale-100 shadow-lg shadow-red-500/20"
                >
                  Confirm Rejection
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingLessonId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingLessonId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[var(--card)] rounded-3xl shadow-2xl border border-[var(--card-border)] overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--card-border)] flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Delete Lesson Plan</h2>
                <button 
                  onClick={() => setDeletingLessonId(null)}
                  className="w-8 h-8 rounded-full bg-[var(--secondary)] flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Are you sure you want to delete this lesson plan? This action cannot be undone.
                </p>
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setDeletingLessonId(null)}
                    className="flex-1 bg-[var(--secondary)] text-slate-700 dark:text-slate-300 rounded-2xl py-3 font-bold active:scale-95 transition-transform"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="flex-1 bg-red-500 text-white rounded-2xl py-3 font-bold active:scale-95 transition-transform shadow-lg shadow-red-500/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RLS Error Modal */}
      <AnimatePresence>
        {rlsError && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRlsError(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[var(--card)] rounded-3xl shadow-2xl border border-[var(--card-border)] overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--card-border)] flex items-center justify-between bg-red-50 dark:bg-red-900/20">
                <h2 className="text-lg font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <X size={24} />
                  Security Policy Error
                </h2>
                <button 
                  onClick={() => setRlsError(false)}
                  className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-500 hover:bg-red-200 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Your Supabase database is blocking the upload because <strong>Row Level Security (RLS)</strong> is enabled for the <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-orange-500">lesson_plans</code> table or the storage bucket.
                </p>
                <div className="bg-slate-900 rounded-2xl p-4">
                  <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">How to fix this instantly:</p>
                  <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
                    <li>Go to your <strong>Supabase Dashboard</strong></li>
                    <li>Click on the <strong>SQL Editor</strong> (left sidebar)</li>
                    <li>Click <strong>New query</strong></li>
                    <li>Paste and run this exact code:</li>
                  </ol>
                  <div className="mt-3 bg-black/50 p-3 rounded-xl border border-slate-700 overflow-x-auto">
                    <code className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                      -- 1. Disable RLS for the database table{'\n'}
                      ALTER TABLE lesson_plans DISABLE ROW LEVEL SECURITY;{'\n\n'}
                      -- 2. Make bucket public{'\n'}
                      UPDATE storage.buckets SET public = true WHERE id = 'lesson-plans';{'\n\n'}
                      -- 3. Allow file uploads via Policy{'\n'}
                      DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;{'\n'}
                      CREATE POLICY "Allow public uploads" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'lesson-plans');{'\n\n'}
                      -- 4. Allow file reading via Policy{'\n'}
                      DROP POLICY IF EXISTS "Allow public read" ON storage.objects;{'\n'}
                      CREATE POLICY "Allow public read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'lesson-plans');
                    </code>
                  </div>
                </div>
                <button 
                  onClick={() => setRlsError(false)}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl py-3 font-bold active:scale-95 transition-transform"
                >
                  I understand, close this
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

