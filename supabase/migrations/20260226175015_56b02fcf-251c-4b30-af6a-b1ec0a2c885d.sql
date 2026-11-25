
-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Patients can view their own appointments
CREATE POLICY "Patients see own appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

-- Doctors can view their own appointments  
CREATE POLICY "Doctors see own appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (auth.uid() = doctor_id);

-- Patients can create appointments
CREATE POLICY "Patients create appointments"
  ON public.appointments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = patient_id);

-- Doctors can update appointments (accept/reject)
CREATE POLICY "Doctors update appointments"
  ON public.appointments FOR UPDATE
  TO authenticated
  USING (auth.uid() = doctor_id);

-- Enable realtime for appointments
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;

-- Fix consultations RLS: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Patients see own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Doctors see own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Patients create consultations" ON public.consultations;
DROP POLICY IF EXISTS "Doctors update consultations" ON public.consultations;

CREATE POLICY "Patients see own consultations"
  ON public.consultations FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "Doctors see own consultations"
  ON public.consultations FOR SELECT
  TO authenticated
  USING (auth.uid() = doctor_id);

CREATE POLICY "Patients create consultations"
  ON public.consultations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Doctors update consultations"
  ON public.consultations FOR UPDATE
  TO authenticated
  USING (auth.uid() = doctor_id);
