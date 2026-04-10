import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Settings, LogOut, ExternalLink, Sun, Moon, Bell, Send, Loader2, ChevronRight, X, Save, Flag, CheckCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getInitials, cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { useAlert } from '../context/AlertContext';
import { supabase } from '../lib/supabase';

export const Profile: React.FC<{ user: any; onSignOut: () => void; onUpdateUser: (user: any) => void }> = ({ user, onSignOut, onUpdateUser }) => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { showAlert, showToast } = useAlert();
  const { addNotification } = useNotifications();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showReportsPanel, setShowReportsPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sending, setSending] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    if (showReportsPanel && user?.role === 'admin') {
      loadReports();
    }
  }, [showReportsPanel, user?.role]);

  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleResolveReport = async (report: any) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'resolved' })
        .eq('id', report.id);
      
      if (error) throw error;

      // Send personal notification to reporter
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      await fetch(`${API_BASE_URL}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Report Resolved',
          message: `Thank you for your report regarding ${report.entity_name}. Information Updated.`,
          type: 'success',
          user_id: report.reporter_id
        })
      });

      // Also send push if possible
      await fetch(`${API_BASE_URL}/api/notifications/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Report Resolved',
          body: `Information updated for ${report.entity_name}.`
        })
      });

      setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'resolved' } : r));
      showToast('Report resolved and user notified', 'success');
    } catch (err) {
      console.error("Error resolving report:", err);
      showToast('Failed to resolve report', 'warning');
    }
  };

  const handleIgnoreReport = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'ignored' })
        .eq('id', id);
      if (error) throw error;
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'ignored' } : r));
      showToast('Report ignored', 'info');
    } catch (err) {
      console.error("Error ignoring report:", err);
    }
  };

  const handleDeleteReport = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setReports(prev => prev.filter(r => r.id !== id));
      showToast('Report deleted', 'info');
    } catch (err) {
      console.error("Error deleting report:", err);
    }
  };

  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success',
    sendPush: false
  });

  const [settingsForm, setSettingsForm] = useState({
    name: user?.name || '',
    password: ''
  });

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await addNotification({
      title: notificationForm.title,
      message: notificationForm.message,
      type: notificationForm.type
    });

    if (notificationForm.sendPush) {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || '';
        await fetch(`${API_BASE_URL}/api/notifications/push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: notificationForm.title,
            body: notificationForm.message
          })
        });
      } catch (err) {
        console.error("Failed to send push notification", err);
      }
    }

    setNotificationForm({ title: '', message: '', type: 'info', sendPush: false });
    setSending(false);
    setShowAdminPanel(false);
    showAlert('Notification sent successfully!');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const updates: any = { name: settingsForm.name };
      if (settingsForm.password) {
        updates.password = settingsForm.password;
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      onUpdateUser({ ...user, ...updates });
      showAlert('Profile updated successfully!');
      setShowSettings(false);
      setSettingsForm(prev => ({ ...prev, password: '' }));
    } catch (err) {
      console.error("Error updating profile:", err);
      showAlert('Failed to update profile.');
    } finally {
      setSavingSettings(false);
    }
  };

  const menuItems = [
    { 
      icon: theme === 'dark' ? Sun : Moon, 
      label: theme === 'dark' ? 'Light Mode' : 'Dark Mode', 
      color: 'text-orange-500', 
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      onClick: toggleTheme
    },
    { icon: RefreshCw, label: t('syncData'), color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
    ...(user?.role === 'admin' ? [{ icon: Settings, label: t('settings'), color: 'text-slate-600', bgColor: 'bg-slate-100 dark:bg-slate-800', onClick: () => setShowSettings(true) }] : []),
    { icon: LogOut, label: t('signOut'), color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-900/20', onClick: onSignOut, isDanger: true },
  ];

  return (
    <div className="space-y-8 pt-4">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-orange-500 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-orange-500/20 mb-4 overflow-hidden">
          <img 
            src={user?.photo || (user?.role === 'student' ? '/s.png' : '/t.png')} 
            alt={user?.name || 'User'} 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.innerText = user?.name ? getInitials(user.name) : 'F';
            }}
          />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name || 'Faruk'}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">{user?.phone || '01827332211'}</p>
        <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
          {user?.role || t('student')}
        </span>
      </div>

      {/* Settings Menu */}
      <div className="bg-[var(--card)] rounded-3xl p-2 shadow-sm border border-[var(--card-border)]">
        {menuItems.map((item, idx) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className="w-full flex items-center justify-between p-4 hover:bg-[var(--secondary)] rounded-2xl transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${item.bgColor} flex items-center justify-center ${item.color}`}>
                <item.icon size={20} />
              </div>
              <span className={`font-semibold ${item.isDanger ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
                {item.label}
              </span>
            </div>
            <div className="text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </div>
          </button>
        ))}
      </div>

      {/* Admin Panel */}
      {user?.role === 'admin' && (
        <div className="space-y-4">
          <div className="bg-[var(--card)] rounded-3xl p-4 shadow-sm border border-[var(--card-border)]">
            <button 
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="w-full flex items-center justify-between p-2"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white">
                  <Bell size={20} />
                </div>
                <span className="font-bold text-slate-900 dark:text-white">Admin: Send Notification</span>
              </div>
              <ChevronRight className={cn("text-slate-400 transition-transform", showAdminPanel && "rotate-90")} size={20} />
            </button>

            <AnimatePresence>
              {showAdminPanel && (
                <motion.form 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  onSubmit={handleSendNotification}
                  className="mt-4 space-y-4 overflow-hidden"
                >
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Title</label>
                    <input 
                      type="text" 
                      required
                      value={notificationForm.title}
                      onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                      placeholder="e.g., School Holiday"
                      className="w-full bg-[var(--secondary)] border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-orange-500/20 dark:text-white text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Message</label>
                    <textarea 
                      required
                      value={notificationForm.message}
                      onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                      placeholder="Enter notification details..."
                      rows={3}
                      className="w-full bg-[var(--secondary)] border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-orange-500/20 dark:text-white text-sm resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    {(['info', 'warning', 'success'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNotificationForm({ ...notificationForm, type })}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all",
                          notificationForm.type === type 
                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" 
                            : "bg-[var(--secondary)] text-slate-500"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={notificationForm.sendPush}
                      onChange={(e) => setNotificationForm({ ...notificationForm, sendPush: e.target.checked })}
                      className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 border-slate-300"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Send as Android Push Notification</span>
                  </label>
                  <button 
                    type="submit"
                    disabled={sending}
                    className="w-full bg-orange-500 text-white rounded-2xl py-3 font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70"
                  >
                    {sending ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Send to All Users</>}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Reports Panel */}
          <div className="bg-[var(--card)] rounded-3xl p-4 shadow-sm border border-[var(--card-border)]">
            <button 
              onClick={() => setShowReportsPanel(!showReportsPanel)}
              className="w-full flex items-center justify-between p-2"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center text-white">
                  <Flag size={20} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">Admin: User Reports</span>
                  {reports.filter(r => r.status === 'pending').length > 0 && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">
                      {reports.filter(r => r.status === 'pending').length} New
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className={cn("text-slate-400 transition-transform", showReportsPanel && "rotate-90")} size={20} />
            </button>

            <AnimatePresence>
              {showReportsPanel && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 space-y-3 overflow-hidden"
                >
                  {loadingReports ? (
                    <div className="text-center py-8 text-slate-500">Loading reports...</div>
                  ) : reports.length > 0 ? (
                    reports.map(report => (
                      <div key={report.id} className="bg-[var(--secondary)] rounded-2xl p-4 border border-[var(--card-border)]">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Reported {report.entity_type}
                            </span>
                            <h4 className="font-bold text-slate-900 dark:text-white">{report.entity_name}</h4>
                            <p className="text-xs text-slate-500">ID/Roll: {report.entity_id}</p>
                          </div>
                          <span className={cn(
                            "px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg",
                            report.status === 'pending' ? "bg-orange-100 text-orange-600" :
                            report.status === 'resolved' ? "bg-green-100 text-green-600" :
                            "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          )}>
                            {report.status}
                          </span>
                        </div>
                        <div className="bg-[var(--card)] p-3 rounded-xl mb-3">
                          <p className="text-sm text-slate-700 dark:text-slate-300">{report.description}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">By: {report.reporter_name}</span>
                          {report.status === 'pending' && (
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleResolveReport(report)}
                                className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors"
                                title="Resolve"
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button 
                                onClick={() => handleIgnoreReport(report.id)}
                                className="p-2 bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                                title="Ignore"
                              >
                                <X size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteReport(report.id)}
                                className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                          {report.status !== 'pending' && (
                            <button 
                              onClick={() => handleDeleteReport(report.id)}
                              className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">No reports found</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Developer Info */}
      <div className="bg-slate-900 dark:bg-slate-800 rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="relative z-10">
          <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-4">{t('developerInfo')}</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold">Md. Faruk Hossain</p>
              <a 
                href="https://mdfaruk.pro.bd/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-400 text-sm flex items-center gap-1 hover:text-white transition-colors"
              >
                mdfaruk.pro.bd <ExternalLink size={12} />
              </a>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              🚀
            </div>
          </div>
        </div>
      </div>
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--card)] w-full max-w-md rounded-3xl shadow-2xl border border-[var(--card-border)] overflow-hidden"
            >
              <div className="p-4 border-b border-[var(--card-border)] flex items-center justify-between">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Settings size={20} className="text-orange-500" />
                  {t('settings')}
                </h3>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              
              <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={settingsForm.name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                    className="w-full bg-[var(--secondary)] border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-orange-500/20 dark:text-white"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">New Password</label>
                  <input 
                    type="password" 
                    placeholder="Leave blank to keep current"
                    value={settingsForm.password}
                    onChange={(e) => setSettingsForm({ ...settingsForm, password: e.target.value })}
                    className="w-full bg-[var(--secondary)] border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-orange-500/20 dark:text-white"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={savingSettings}
                  className="w-full bg-orange-500 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 mt-6 active:scale-95 transition-transform disabled:opacity-70"
                >
                  {savingSettings ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Save Changes</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
