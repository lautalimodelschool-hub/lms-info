-- Run this script in your Supabase SQL Editor to create 3 accounts

-- 1. Create Admin Account
INSERT INTO public.users (name, phone, password, role, approved)
VALUES ('Admin User', '01700000001', 'password123', 'admin', true)
ON CONFLICT (phone) DO UPDATE 
SET role = 'admin', approved = true, password = 'password123';

-- 2. Create Teacher Account
INSERT INTO public.users (name, phone, password, role, approved)
VALUES ('Teacher User', '01700000002', 'password123', 'teacher', true)
ON CONFLICT (phone) DO UPDATE 
SET role = 'teacher', approved = true, password = 'password123';

-- 3. Create Student Account
INSERT INTO public.users (name, phone, password, role, approved)
VALUES ('Student User', '01700000003', 'password123', 'student', true)
ON CONFLICT (phone) DO UPDATE 
SET role = 'student', approved = true, password = 'password123';
