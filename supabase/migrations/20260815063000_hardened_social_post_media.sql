-- Migration: Hardened Media-First Instagram Publishing System
-- Target: Add post_type to social_posts, create social_post_media table with constraints and RLS

-- 1. Add post_type discriminator column to social_posts
ALTER TABLE public.social_posts 
ADD COLUMN IF NOT EXISTS post_type text NOT NULL DEFAULT 'image';

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'social_posts_post_type_check'
    ) THEN
        ALTER TABLE public.social_posts 
        ADD CONSTRAINT social_posts_post_type_check 
        CHECK (post_type IN ('image', 'carousel', 'reel'));
    END IF;
END $$;

-- 2. Create social_post_media table for multi-media carousels and video reels
CREATE TABLE IF NOT EXISTS public.social_post_media (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    social_post_id uuid NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
    storage_path text NOT NULL,
    public_url text NOT NULL,
    media_type text NOT NULL DEFAULT 'image',
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT social_post_media_media_type_check CHECK (media_type IN ('image', 'video')),
    CONSTRAINT social_post_media_sort_order_check CHECK (sort_order >= 0),
    CONSTRAINT social_post_media_unique_post_order UNIQUE (social_post_id, sort_order)
);

-- 3. Create index for performant ordering of carousel items
CREATE INDEX IF NOT EXISTS idx_social_post_media_post_id_sort 
ON public.social_post_media(social_post_id, sort_order);

-- 4. Enable Row Level Security on social_post_media
ALTER TABLE public.social_post_media ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for social_post_media using established has_role helper
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'social_post_media' AND policyname = 'Public read for published posts media'
    ) THEN
        CREATE POLICY "Public read for published posts media" 
        ON public.social_post_media FOR SELECT 
        USING (EXISTS (
            SELECT 1 FROM public.social_posts 
            WHERE public.social_posts.id = public.social_post_media.social_post_id 
            AND public.social_posts.status = 'published'
        ));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'social_post_media' AND policyname = 'Admins full access to social_post_media'
    ) THEN
        CREATE POLICY "Admins full access to social_post_media" 
        ON public.social_post_media FOR ALL 
        TO authenticated 
        USING (public.has_role(auth.uid(), 'admin')) 
        WITH CHECK (public.has_role(auth.uid(), 'admin'));
    END IF;
END $$;
