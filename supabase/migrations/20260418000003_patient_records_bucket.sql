-- Patient records storage bucket

INSERT INTO storage.buckets (id, name, public)
VALUES ('patient_records', 'patient_records', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for public access (demo environment)
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT
USING ( bucket_id = 'patient_records' );

CREATE POLICY "Public Insert" 
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'patient_records' );
