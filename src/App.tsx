import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { AlertProvider } from './context/AlertContext';
import { Layout } from './components/Layout';
import { Home } from './screens/Home';
import { Students } from './screens/Students';
import { Employees } from './screens/Employees';
import { Profile } from './screens/Profile';
import { Auth } from './screens/Auth';
import { LessonPlans } from './screens/LessonPlans';
import { SplashScreen } from './components/SplashScreen';
import { SyncModal } from './components/SyncModal';
import { ShieldAlert } from 'lucide-react';
import { get } from 'idb-keyval';
import { fetchStudents, fetchEmployees } from './api/schoolApi';
import './i18n';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [showSync, setShowSync] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      // Check local storage for session
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }

      // Check if we need initial sync
      const studentsCached = await get('students_all');
      const employeesCached = await get('employees_all');

      if (!studentsCached || !employeesCached) {
        setShowSync(true);
        try {
          // Perform initial sync
          await Promise.all([
            fetchStudents('All Classes'),
            fetchEmployees()
          ]);
        } catch (error) {
          console.error("Initial sync failed", error);
        } finally {
          setShowSync(false);
        }
      }

      setLoading(false);
    };

    initialize();
  }, []);

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <SyncModal isOpen={showSync} />
      
      <div style={{ display: showSplash ? 'none' : 'block' }}>
        {!user ? (
          <NotificationProvider>
            <AlertProvider>
              <Auth onAuthSuccess={handleAuthSuccess} />
            </AlertProvider>
          </NotificationProvider>
        ) : !user.approved && user.role !== 'admin' ? (
          <AlertProvider>
            <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col items-center justify-center p-6 text-center">
              <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-500 mb-6">
                <ShieldAlert size={40} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Account Pending</h1>
              <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs">
                Your account is currently waiting for administrator approval. Please check back later.
              </p>
              <button 
                onClick={handleSignOut}
                className="px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium active:scale-95 transition-transform"
              >
                Sign Out
              </button>
            </div>
          </AlertProvider>
        ) : (
          <NotificationProvider userId={user.id}>
            <AlertProvider>
              <Router>
                <Layout user={user}>
                  <Routes>
                    <Route path="/" element={<Home user={user} />} />
                    <Route path="/students" element={<Students user={user} />} />
                    <Route path="/employees" element={<Employees user={user} />} />
                    <Route path="/profile" element={<Profile user={user} onSignOut={handleSignOut} onUpdateUser={handleAuthSuccess} />} />
                    <Route path="/lesson-plans" element={<LessonPlans user={user} />} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </Layout>
              </Router>
            </AlertProvider>
          </NotificationProvider>
        )}
      </div>
    </ThemeProvider>
  );
}
