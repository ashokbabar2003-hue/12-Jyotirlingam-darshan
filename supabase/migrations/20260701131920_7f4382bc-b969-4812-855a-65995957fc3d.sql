
CREATE TABLE public.stotram_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX stotram_messages_user_slug_idx ON public.stotram_messages (user_id, slug, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stotram_messages TO authenticated;
GRANT ALL ON public.stotram_messages TO service_role;
ALTER TABLE public.stotram_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own stotram messages" ON public.stotram_messages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own stotram messages" ON public.stotram_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own stotram messages" ON public.stotram_messages
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
