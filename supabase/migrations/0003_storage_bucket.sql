-- Create memory-media storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'memory-media',
  'memory-media',
  true,
  10485760, -- 10MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to memory-media
CREATE POLICY "Authenticated users can upload media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'memory-media');

-- Allow public read access (images load without auth)
CREATE POLICY "Public read access for memory-media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'memory-media');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Users can delete own media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'memory-media');
