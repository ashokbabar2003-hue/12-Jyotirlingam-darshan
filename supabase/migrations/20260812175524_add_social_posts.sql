CREATE TABLE IF NOT EXISTS public.social_posts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    jyotirlinga_slug text NOT NULL,
    status text NOT NULL DEFAULT 'draft',
    caption text,
    image_prompt text,
    image_url text,
    instagram_media_id text,
    scheduled_for timestamp with time zone,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Index for future publishing worker
CREATE INDEX IF NOT EXISTS idx_social_posts_status_scheduled 
ON public.social_posts(status, scheduled_for);

-- RLS Policies
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

-- Granular admin-only policies using the project's existing RBAC
CREATE POLICY "Admins can view social posts" 
    ON public.social_posts FOR SELECT 
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert social posts" 
    ON public.social_posts FOR INSERT 
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update social posts" 
    ON public.social_posts FOR UPDATE 
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete social posts" 
    ON public.social_posts FOR DELETE 
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
