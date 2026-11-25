-- Create storage bucket for skin analysis images
INSERT INTO storage.buckets (id, name, public) VALUES ('skin-analyses', 'skin-analyses', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own analysis images
CREATE POLICY "Users upload own analysis images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'skin-analyses' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow anyone to view analysis images (public bucket)
CREATE POLICY "Public read analysis images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'skin-analyses');

-- Allow users to delete their own analysis images
CREATE POLICY "Users delete own analysis images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'skin-analyses' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create notifications table for skincare reminders
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'reminder',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System inserts notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);