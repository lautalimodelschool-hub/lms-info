-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    reporter_name TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- 'student' or 'employee'
    entity_id TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'ignored')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policies
-- Anyone can create a report (since we use custom auth, Supabase sees everyone as 'anon')
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Anyone can create reports"
    ON public.reports FOR INSERT
    WITH CHECK (true);

-- Anyone can view reports (simplified for custom auth)
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
CREATE POLICY "Anyone can view reports"
    ON public.reports FOR SELECT
    USING (true);

-- Anyone can update reports (simplified for custom auth)
DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
CREATE POLICY "Anyone can update reports"
    ON public.reports FOR UPDATE
    USING (true);

-- Anyone can delete reports (simplified for custom auth)
DROP POLICY IF EXISTS "Admins can delete reports" ON public.reports;
CREATE POLICY "Anyone can delete reports"
    ON public.reports FOR DELETE
    USING (true);

