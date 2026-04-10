import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ArrowUpDown } from 'lucide-react';
import { fetchStudents } from '../api/schoolApi';
import { CustomListTile } from '../components/CustomListTile';
import { ReportModal } from '../components/ReportModal';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import i18n from '../i18n';
import { useAlert } from '../context/AlertContext';

export const Students: React.FC<{ user?: any }> = ({ user }) => {
  const { t } = useTranslation();
  const { showAlert } = useAlert();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeClass, setActiveClass] = useState('All Classes');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportingStudent, setReportingStudent] = useState<any>(null);

  const classes = ['All Classes', 'Play', 'Nursery', 'Pre-1', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];

  const handleStudentContactClick = (e: React.MouseEvent) => {
    if (user?.role === 'student') {
      e.preventDefault();
      showAlert(t('studentFeatureRestricted'));
    }
  };

  useEffect(() => {
    const loadStudents = async () => {
      // Only show loading if we have no students at all
      if (students.length === 0) setLoading(true);
      const data = await fetchStudents(activeClass);
      setStudents(data.students || []);
      setLoading(false);
    };
    loadStudents();
  }, [activeClass]);

  const filteredStudents = students.filter(s => 
    (s.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (s.roll?.toString() || '').includes(searchQuery) ||
    (s.phone || '').includes(searchQuery)
  );

  // Group by class
  const groupedStudents = filteredStudents.reduce((acc: any, student) => {
    const className = student.class || 'Other';
    if (!acc[className]) acc[className] = [];
    acc[className].push(student);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('students')}</h1>
        <div className="flex bg-[var(--card)] rounded-lg p-1 shadow-sm border border-[var(--card-border)]">
          <button className="px-3 py-1 text-xs font-medium text-slate-400 dark:text-slate-500">{t('name')}</button>
          <button className="px-3 py-1 text-xs font-medium bg-[var(--secondary)] text-slate-900 dark:text-white rounded-md flex items-center gap-1">
            <ArrowUpDown size={12} />
            {t('serial')}
          </button>
        </div>
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

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {classes.map((cls) => (
          <button
            key={cls}
            onClick={() => setActiveClass(cls)}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              activeClass === cls 
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" 
                : "bg-[var(--card)] text-slate-600 dark:text-slate-400 border border-[var(--card-border)]"
            )}
          >
            {cls === 'All Classes' ? t('allClasses') : cls}
          </button>
        ))}
      </div>

      {/* Student List */}
      <div className="space-y-8">
        {loading ? (
          <div className="text-center py-12 text-slate-500">{t('loading')}</div>
        ) : Object.keys(groupedStudents).length > 0 ? (
          Object.entries(groupedStudents).map(([className, classStudents]: [string, any]) => (
            <div key={className}>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{className}</h2>
              <div className="space-y-1">
                {classStudents.map((student: any, idx: number) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    key={student.id || idx}
                  >
                    <CustomListTile
                      name={student.name}
                      subtitle={`Class ${student.class} • Roll ${student.roll}`}
                      phone={student.phone}
                      photo={student.photo || '/s.png'}
                      isRestricted={user?.role === 'student'}
                      onRestrictedAction={handleStudentContactClick}
                      onReport={(user?.role === 'teacher' || user?.role === 'admin') ? () => setReportingStudent(student) : undefined}
                      details={{
                        'Father Name': student.fatherName,
                        'Mother Name': student.motherName,
                        'Blood Group': student.bloodGroup,
                        'Address': student.address || student.presentAddress,
                        'Date of Birth': student.dob || student.dateOfBirth,
                        'Gender': student.gender,
                        'Religion': student.religion,
                        'Section': student.section,
                        'Shift': student.shift,
                        'Version': student.version || student.medium,
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-slate-500">{t('noData')}</div>
        )}
      </div>

      {reportingStudent && (
        <ReportModal
          isOpen={!!reportingStudent}
          onClose={() => setReportingStudent(null)}
          entityType="student"
          entityName={reportingStudent.name}
          entityId={reportingStudent.roll?.toString() || reportingStudent.id?.toString() || 'Unknown'}
          reporterId={user?.id}
          reporterName={user?.name}
        />
      )}
    </div>
  );
};
