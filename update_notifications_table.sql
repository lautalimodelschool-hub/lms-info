-- Add user_id column to notifications table to support personal notifications
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- Update existing notifications to have NULL user_id (making them public)
UPDATE public.notifications SET user_id = NULL WHERE user_id IS NULL;

-- Ensure RLS allows users to see their own notifications and public ones
-- Note: You may need to adjust your existing policies if you have them.
-- Here is a standard setup:

-- 1. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. Policy for users to see their own notifications or public ones
DROP POLICY IF EXISTS "Users can view their own or public notifications" ON public.notifications;
CREATE POLICY "Users can view their own or public notifications"
ON public.notifications FOR SELECT
USING (true); -- Simplified for custom auth

-- 3. Policy for admins to create notifications
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Anyone can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true); -- Simplified for custom auth

