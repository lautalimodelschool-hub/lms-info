export interface Student {
  id: string;
  name: string;
  roll: string;
  class: string;
  section: string;
  phone: string;
  address: string;
  photo: string;
}

export interface Employee {
  id: string;
  name: string;
  designation: string;
  phone: string;
  photo: string;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  role: 'admin' | 'teacher' | 'student' | 'pending';
  approved: boolean;
  class_name?: string;
}

export interface LessonPlan {
  id: string;
  title: string;
  description: string;
  class_id: string;
  teacher_id: string;
  subject_name: string;
  file_url: string;
  file_type: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
}
