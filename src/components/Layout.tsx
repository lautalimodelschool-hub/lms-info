import React from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Users, GraduationCap, User, Bell, Sun, Moon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

import { useNotifications } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useAlert } from '../context/AlertContext';

interface LayoutProps {
  children: React.ReactNode;
  user: {
    name: string;
    role: string;
    photo?: string;
  } | null;
}

export const Layout: React.FC<LayoutProps> = ({ children, user }) => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, deleteNotification } = useNotifications();
  const { showToast } = useAlert();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const prevNotificationsCount = React.useRef(notifications.length);

  // Initialize push notifications
  usePushNotifications();

  // Watch for new notifications to show toast
  React.useEffect(() => {
    if (notifications.length > prevNotificationsCount.current) {
      const newNotification = notifications[0]; // Assuming newest is first
      if (newNotification && !newNotification.read) {
        showToast(newNotification.title, newNotification.type);
      }
    }
    prevNotificationsCount.current = notifications.length;
  }, [notifications, showToast]);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'bn' : 'en');
  };

  const navItems = [
    { to: '/', icon: Home, label: t('home') },
    { to: '/students', icon: Users, label: t('students') },
    { to: '/employees', icon: GraduationCap, label: t('employees') },
    { to: '/profile', icon: User, label: t('profile') },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-20 transition-colors duration-300">
      {/* Top Bar */}
      <header className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-[var(--background)]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold overflow-hidden">
            <img 
              src={(user as any)?.photo || (user?.role === 'student' ? '/s.png' : '/t.png')} 
              alt={user?.name || 'User'} 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerText = user?.name?.[0] || 'F';
              }}
            />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('hello')}</p>
            <h1 className="font-bold text-slate-900 dark:text-white">{user?.name || 'Faruk'}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleLanguage}
            className="w-10 h-10 rounded-full bg-[var(--secondary)] flex items-center justify-center text-orange-600 dark:text-slate-300 shadow-sm border border-[var(--card-border)] text-xs font-bold"
          >
            {i18n.language.toUpperCase()}
          </button>
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-[var(--secondary)] flex items-center justify-center text-orange-600 dark:text-slate-300 shadow-sm border border-[var(--card-border)]"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-10 h-10 rounded-full bg-[var(--secondary)] flex items-center justify-center text-orange-600 dark:text-slate-300 shadow-sm border border-[var(--card-border)] relative"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white">{t('notifications')}</h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold">
                        {unreadCount} NEW
                      </span>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={32} />
                        <p className="text-sm text-slate-500 dark:text-slate-400">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className={cn(
                            "p-4 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer relative",
                            !n.read && "bg-orange-50/30 dark:bg-orange-900/10"
                          )}
                          onClick={() => markAsRead(n.id)}
                        >
                          {!n.read && (
                            <div className="absolute top-4 left-2 w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                          )}
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white pr-6">{n.title}</h4>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(n.id);
                              }}
                              className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">{n.message}</p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {formatDistanceToNow(new Date(n.date), { addSuffix: true })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-100 dark:border-slate-800 px-6 py-3 flex justify-between items-center z-20">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 transition-all duration-300",
                isActive ? "text-orange-500" : "text-slate-400 dark:text-slate-500"
              )
            }
          >
            <item.icon size={22} className={cn("transition-transform", "hover:scale-110")} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
