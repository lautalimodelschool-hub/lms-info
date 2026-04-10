import { get, set } from 'idb-keyval';

const memoryCache: Record<string, any> = {};
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const fetchStudentsFromServer = async (apiClass: string | undefined, cacheKey: string) => {
  const params = new URLSearchParams();
  params.append("page", "1");
  params.append("limit", "200"); // Fetch more to ensure we get all for the class
  if (apiClass) {
    params.append("class", apiClass);
  }
  params.append("shift", "Morning");
  params.append("medium", "Bangla Version");
  params.append("academicYear", "2026");

  try {
    const res = await fetch(`${API_BASE_URL}/api/school/students?${params.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    const students = (data.data || []).map((std: any) => ({
      ...std,
      name: std.studentName || std.fullName || `${std.firstName || ''} ${std.lastName || ''}`.trim() || 'Unknown',
      phone: std.guardianNumber || std.phoneNumber || std.phone || '',
      photo: std.imageUrl || std.photo ? ((std.imageUrl || std.photo).startsWith('http') ? (std.imageUrl || std.photo) : `${API_BASE_URL || window.location.origin}${std.imageUrl || std.photo}`) : undefined,
      class: std.class || std.className || 'N/A',
      roll: std.roll || std.rollNumber || '0'
    }));
    
    const result = { students, total: data.pagination?.total || students.length };
    await set(cacheKey, result);
    return result;
  } catch (error) {
    return null;
  }
};

export const fetchStudents = async (className?: string) => {
  const cacheKey = `students_${className || 'all'}`;
  const apiClass = className === "Pre-1" ? "Pre-One" : (className === "All Classes" ? undefined : className);
  
  if (memoryCache[cacheKey]) {
    fetchStudentsFromServer(apiClass, cacheKey).then(res => {
      if (res) memoryCache[cacheKey] = res;
    });
    return memoryCache[cacheKey];
  }

  const idbData = await get(cacheKey);
  if (idbData) {
    memoryCache[cacheKey] = idbData;
    fetchStudentsFromServer(apiClass, cacheKey).then(res => {
      if (res) memoryCache[cacheKey] = res;
    });
    return idbData;
  }

  const result = await fetchStudentsFromServer(apiClass, cacheKey);
  if (result) {
    memoryCache[cacheKey] = result;
    return result;
  }

  return { students: [], total: 0 };
};

const fetchEmployeesFromServer = async (cacheKey: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/school/employees?page=1&limit=100`);
    if (!res.ok) return null;
    const data = await res.json();
    const employees = (data.data || []).map((emp: any) => ({
      ...emp,
      name: emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown',
      phone: emp.phoneNumber || '',
      photo: emp.imageUrl ? (emp.imageUrl.startsWith('http') ? emp.imageUrl : `${API_BASE_URL || window.location.origin}${emp.imageUrl}`) : undefined,
      designation: emp.designation || 'Staff'
    }));
    
    await set(cacheKey, employees);
    return employees;
  } catch (error) {
    return null;
  }
};

export const fetchEmployees = async () => {
  const cacheKey = 'employees_all';
  
  if (memoryCache[cacheKey]) {
    fetchEmployeesFromServer(cacheKey).then(res => {
      if (res) memoryCache[cacheKey] = res;
    });
    return memoryCache[cacheKey];
  }

  const idbData = await get(cacheKey);
  if (idbData) {
    memoryCache[cacheKey] = idbData;
    fetchEmployeesFromServer(cacheKey).then(res => {
      if (res) memoryCache[cacheKey] = res;
    });
    return idbData;
  }

  const result = await fetchEmployeesFromServer(cacheKey);
  if (result) {
    memoryCache[cacheKey] = result;
    return result;
  }

  return [];
};
