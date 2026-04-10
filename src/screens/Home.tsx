import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, BookOpen, ChevronRight } from 'lucide-react';
import { fetchStudents, fetchEmployees } from '../api/schoolApi';
import { CustomListTile } from '../components/CustomListTile';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import i18n from '../i18n';
import { useAlert } from '../context/AlertContext';

import { useNotifications } from '../context/NotificationContext';
import { Bell, X } from 'lucide-react';

export const Home: React.FC<{ user?: any }> = ({ user }) => {
  const { t } = useTranslation();
  const { showAlert } = useAlert();
  const { notifications, markAsRead } = useNotifications();
  const [showBanner, setShowBanner] = useState(true);
  const unreadNotifications = notifications.filter(n => !n.read);
  const latestNotification = unreadNotifications[0];

  const handleStudentContactClick = (e: React.MouseEvent) => {
    if (user?.role === 'student') {
      e.preventDefault();
      showAlert(t('studentFeatureRestricted'));
    }
  };

  const [stats, setStats] = useState({
    students: 0,
    employees: 0,
    classes: 12,
    lessonPlans: 8
  });
  const [recentContacts, setRecentContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [studentData, employees] = await Promise.all([
        fetchStudents(),
        fetchEmployees()
      ]);
      
      setStats(prev => ({
        ...prev,
        students: studentData.total || 0,
        employees: employees.length || 0
      }));

      // Mock recent contacts from students
      setRecentContacts((studentData.students || []).slice(0, 5));
      setLoading(false);
    };

    loadData();
  }, []);

  const overviewCards = [
    { label: t('students'), value: stats.students, icon: '👥', color: 'bg-orange-500/10 text-orange-600' },
    { label: t('employees'), value: stats.employees, icon: '🎓', color: 'bg-blue-500/10 text-blue-600' },
    { label: t('classes'), value: stats.classes, icon: '📖', color: 'bg-purple-500/10 text-purple-600' },
  ];

  return (
    <div className="space-y-8">
      {/* School Logo & Welcome */}
      <div className="flex items-center gap-4 bg-[var(--card)] p-4 rounded-3xl shadow-sm border border-[var(--card-border)]">
        <img 
          src="/logo.png" 
          alt="School Logo" 
          className="w-16 h-16 object-contain drop-shadow-md"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://via.placeholder.com/64?text=LMS";
          }}
        />
        <div>
          <h2 className="font-black text-slate-900 dark:text-white leading-tight text-lg">
            {i18n.language === 'bn' ? 'লাউতলী মডেল স্কুল' : 'LAUTOLI MODEL SCHOOL'}
          </h2>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold mt-1">
            {i18n.language === 'bn' ? 'ফরিদগঞ্জ, চাঁদপুর' : 'FARIDGANJ, CHANDPUR'}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search size={18} className="text-orange-400" />
        </div>
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          className="w-full bg-[var(--card)] border border-[var(--card-border)] rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-orange-500/20 dark:text-white transition-all"
        />
      </div>

      {/* Notification Banner */}
      {showBanner && latestNotification && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-500 to-rose-500 text-white p-4 rounded-3xl shadow-lg shadow-orange-500/20 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Bell size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm leading-tight">{latestNotification.title}</h4>
              <p className="text-[10px] text-white/80 line-clamp-1">{latestNotification.message}</p>
            </div>
          </div>
          <button 
            onClick={() => {
              markAsRead(latestNotification.id);
              setShowBanner(false);
            }}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}

      {/* Overview */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('overview')}</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {overviewCards.map((card, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={card.label}
              className="bg-[var(--card)] rounded-2xl p-4 flex flex-col items-center text-center shadow-sm border border-[var(--card-border)]"
            >
              <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center text-xl mb-2`}>
                {card.icon}
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">{card.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Lesson Plans Button */}
        <Link 
          to="/lesson-plans"
          className="w-full bg-[var(--card)] border border-[var(--card-border)] p-5 rounded-3xl flex items-center justify-between group active:scale-[0.98] transition-all shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white">
              <BookOpen size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">{t('lessonPlans')}</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">{stats.lessonPlans} {t('lessonPlans')} Available</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:translate-x-1 transition-transform">
            <ChevronRight size={20} />
          </div>
        </Link>
      </section>

      {/* Recent Contacts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('recentContacts')}</h2>
          <button className="text-orange-500 text-sm font-medium">{t('viewAll')}</button>
        </div>
        
        <div className="space-y-1">
          {loading ? (
            <div className="text-center py-8 text-slate-500">{t('loading')}</div>
          ) : recentContacts.length > 0 ? (
            recentContacts.map((contact, idx) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={contact.id || idx}
              >
                <CustomListTile
                  name={contact.name}
                  subtitle={`Class ${contact.class} • Roll ${contact.roll}`}
                  phone={contact.phone}
                  photo={contact.photo}
                  isRestricted={user?.role === 'student'}
                  onRestrictedAction={handleStudentContactClick}
                  details={{
                    'Father Name': contact.fatherName,
                    'Mother Name': contact.motherName,
                    'Blood Group': contact.bloodGroup,
                    'Address': contact.address || contact.presentAddress,
                  }}
                />
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">{t('noData')}</div>
          )}
        </div>
      </section>

      {/* Floating Action Button */}
      <button className="fixed bottom-24 right-6 w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-500/40 z-10 active:scale-90 transition-transform">
        <Plus size={28} />
      </button>
    </div>
  );
};
