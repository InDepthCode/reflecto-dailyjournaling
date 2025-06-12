-- Create the 'journal_entries' table
CREATE TABLE public.journal_entries (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    content text NULL,
    user_id uuid NOT NULL DEFAULT auth.uid(),
    CONSTRAINT journal_entries_pkey PRIMARY KEY (id),
    CONSTRAINT journal_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add comments to the table and columns for clarity
COMMENT ON TABLE public.journal_entries IS 'Stores journal entries for users.';

-- Enable Row Level Security (RLS) on the table
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to SELECT their own entries
CREATE POLICY "Allow individual read access"
ON public.journal_entries
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create policy to allow users to INSERT entries for themselves
CREATE POLICY "Allow individual insert access"
ON public.journal_entries
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to DELETE their own entries
CREATE POLICY "Allow individual delete access"
ON public.journal_entries
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);