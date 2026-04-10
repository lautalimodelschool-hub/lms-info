import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, UserPlus, Users } from 'lucide-react';
import { fetchEmployees } from '../api/schoolApi';
import { CustomListTile } from '../components/CustomListTile';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAlert } from '../context/AlertContext';

import { ReportModal } from '../components/ReportModal';

const PendingUserCard = ({ user, onApprove }: { user: any, onApprove: (id: string, role: string) => void }) => {
  const [selectedRole, setSelectedRole] = useState('student');
  return (
    <div className="bg-[var(--card)] rounded-2xl p-4 mb-3 shadow-sm border border-[var(--card-border)]">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">{user.name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{user.phone}</p>
        </div>
        <span className="px-2 py-1 bg-orange-100 text-orange-600 text-[10px] uppercase tracking-wider font-bold rounded-lg">Pending</span>
      </div>
      <div className="flex items-center gap-3">
        <select 
          value={selectedRole} 
          onChange={(e) => setSelectedRole(e.target.value)}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm flex-1 dark:text-white focus:ring-2 focus:ring-orange-500/20 outline-none"
        >
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
        <button 
          onClick={() => onApprove(user.id, selectedRole)}
          className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-green-500/20 active:scale-95 transition-transform"
        >
          Approve
        </button>
      </div>
    </div>
  );
};

const ManageUserCard = ({ user, onUpdateRole, onRevoke }: { user: any, onUpdateRole: (id: string, role: string) => void, onRevoke: (id: string) => void }) => {
  const [selectedRole, setSelectedRole] = useState(user.role || 'student');
  return (
    <div className="bg-[var(--card)] rounded-2xl p-4 mb-3 shadow-sm border border-[var(--card-border)]">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">{user.name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{user.phone}</p>
        </div>
        <span className="px-2 py-1 bg-blue-100 text-blue-600 text-[10px] uppercase tracking-wider font-bold rounded-lg">{user.role}</span>
      </div>
      <div className="flex items-center gap-2">
        <select 
          value={selectedRole} 
          onChange={(e) => setSelectedRole(e.target.value)}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm flex-1 dark:text-white focus:ring-2 focus:ring-orange-500/20 outline-none"
        >
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
        <button 
          onClick={() => onUpdateRole(user.id, selectedRole)}
          disabled={selectedRole === user.role}
          className="bg-blue-500 disabled:bg-slate-300 text-white px-3 py-2 rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-transform"
        >
          Update
        </button>
        <button 
          onClick={() => onRevoke(user.id)}
          className="bg-red-50 text-red-600 px-3 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform"
        >
          Revoke
        </button>
      </div>
    </div>
  );
};

export const Employees: React.FC<{ user?: any }> = ({ user }) => {
  const userRole = user?.role;
  const { t } = useTranslation();
  const { showAlert, showConfirm } = useAlert();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'users'>('all');

  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  
  const [appUsers, setAppUsers] = useState<any[]>([]);
  const [loadingAppUsers, setLoadingAppUsers] = useState(false);
  
  const [reportingEmployee, setReportingEmployee] = useState<any>(null);

  useEffect(() => {
    const loadEmployees = async () => {
      if (employees.length === 0) setLoading(true);
      const data = await fetchEmployees();
      setEmployees(data);
      setLoading(false);
    };
    loadEmployees();
  }, []);

  useEffect(() => {
    if (activeTab === 'pending' && userRole === 'admin') {
      loadPendingUsers();
    } else if (activeTab === 'users' && userRole === 'admin') {
      loadAppUsers();
    }
  }, [activeTab, userRole]);

  const loadPendingUsers = async () => {
    setLoadingPending(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('approved', false);
      if (error) throw error;
      setPendingUsers(data || []);
    } catch (err) {
      console.error("Error fetching pending users:", err);
    } finally {
      setLoadingPending(false);
    }
  };

  const loadAppUsers = async () => {
    setLoadingAppUsers(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('approved', true);
      if (error) throw error;
      setAppUsers(data || []);
    } catch (err) {
      console.error("Error fetching app users:", err);
    } finally {
      setLoadingAppUsers(false);
    }
  };

  const handleApprove = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ approved: true, role })
        .eq('id', userId);
      if (error) throw error;
      
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      showAlert('User approved successfully!');
    } catch (err) {
      console.error("Error approving user:", err);
      showAlert('Failed to approve user.');
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId);
      if (error) throw error;
      
      setAppUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
      showAlert('User role updated successfully!');
    } catch (err) {
      console.error("Error updating user role:", err);
      showAlert('Failed to update user role.');
    }
  };

  const handleRevoke = async (userId: string) => {
    showConfirm('Are you sure you want to revoke access for this user? They will be moved back to pending status.', async () => {
      try {
        const { error } = await supabase
          .from('users')
          .update({ approved: false, role: 'pending' })
          .eq('id', userId);
        if (error) throw error;
        
        setAppUsers(prev => prev.filter(u => u.id !== userId));
        showAlert('User access revoked.');
      } catch (err) {
        console.error("Error revoking user:", err);
        showAlert('Failed to revoke user access.');
      }
    });
  };

  const filteredEmployees = employees.filter(e => 
    (e.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (e.designation?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (e.phone || '').includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('employees')}</h1>
        {userRole === 'admin' && (
          <div className="flex bg-[var(--card)] rounded-lg p-1 shadow-sm border border-[var(--card-border)]">
            <button 
              onClick={() => setActiveTab('all')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                activeTab === 'all' ? "bg-[var(--secondary)] text-slate-900 dark:text-white" : "text-slate-400"
              )}
            >
              {t('viewAll')}
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1",
                activeTab === 'users' ? "bg-blue-500 text-white" : "text-slate-400"
              )}
            >
              <Users size={12} />
              App Users
            </button>
            <button 
              onClick={() => setActiveTab('pending')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1",
                activeTab === 'pending' ? "bg-orange-500 text-white" : "text-slate-400"
              )}
            >
              <UserPlus size={12} />
              {t('pendingUsers')}
            </button>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search size={18} className="text-orange-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full bg-[var(--card)] border border-[var(--card-border)] rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-orange-500/20 dark:text-white transition-all"
        />
      </div>

      {/* List Area */}
      <div className="space-y-1">
        {activeTab === 'all' ? (
          loading ? (
            <div className="text-center py-12 text-slate-500">{t('loading')}</div>
          ) : filteredEmployees.length > 0 ? (
            filteredEmployees.map((employee, idx) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={employee.id || idx}
              >
                <CustomListTile
                  name={employee.name}
                  subtitle={employee.designation}
                  phone={employee.phone}
                  photo={employee.photo || '/t.png'}
                  showAdminActions={userRole === 'admin'}
                  onReport={(userRole === 'teacher' || userRole === 'admin') ? () => setReportingEmployee(employee) : undefined}
                  details={{
                    'Email': employee.email,
                    'Blood Group': employee.bloodGroup,
                    'Address': employee.address || employee.presentAddress,
                    'Date of Birth': employee.dob || employee.dateOfBirth,
                    'Gender': employee.gender,
                    'Religion': employee.religion,
                    'Joining Date': employee.joiningDate,
                    'Department': employee.department,
                    'Education': employee.education || employee.qualification,
                  }}
                />
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-500">{t('noData')}</div>
          )
        ) : activeTab === 'pending' ? (
          loadingPending ? (
            <div className="text-center py-12 text-slate-500">{t('loading')}</div>
          ) : pendingUsers.length > 0 ? (
            pendingUsers.map((user, idx) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={user.id || idx}
              >
                <PendingUserCard user={user} onApprove={handleApprove} />
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-500">No pending users</div>
          )
        ) : (
          loadingAppUsers ? (
            <div className="text-center py-12 text-slate-500">{t('loading')}</div>
          ) : appUsers.length > 0 ? (
            appUsers.map((user, idx) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={user.id || idx}
              >
                <ManageUserCard user={user} onUpdateRole={handleUpdateRole} onRevoke={handleRevoke} />
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-500">No app users found</div>
          )
        )}
      </div>

      {/* Report Modal */}
      {reportingEmployee && (
        <ReportModal
          isOpen={!!reportingEmployee}
          onClose={() => setReportingEmployee(null)}
          entityType="employee"
          entityName={reportingEmployee.name}
          entityId={reportingEmployee.id?.toString() || reportingEmployee.phone || 'Unknown'}
          reporterId={user?.id || 'unknown'}
          reporterName={user?.name || 'Teacher'}
        />
      )}
    </div>
  );
};
