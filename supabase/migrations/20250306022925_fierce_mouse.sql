/*
  # Add payment and verification fields to profiles table

  1. Changes
    - Add payment tracking fields (status, id, amount, type)
    - Add document verification fields
    - Add admin flag for privileged users
    - Add constraints and validations
    - Set up proper RLS policies

  2. Security
    - Enable RLS
    - Add policies for regular users and admins
    - Create necessary indexes for performance
*/

-- Add new columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_id text,
ADD COLUMN IF NOT EXISTS payment_amount numeric(10,2),
ADD COLUMN IF NOT EXISTS payment_type text,
ADD COLUMN IF NOT EXISTS documents_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_date timestamptz,
ADD COLUMN IF NOT EXISTS verification_admin_id uuid,
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Add validation for payment_status
ALTER TABLE public.profiles
ADD CONSTRAINT valid_payment_status 
CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed'));

-- Add validation for payment_type
ALTER TABLE public.profiles
ADD CONSTRAINT valid_payment_type 
CHECK (payment_type IN ('monthly', 'yearly'));

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own payment info" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own basic info" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create new policies
CREATE POLICY "Users can read own payment info"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id OR is_admin = true);

-- Policy for regular users to update only their basic info
CREATE POLICY "Users can update own basic info"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id AND 
  NOT is_admin
);

-- Policy for admins to update any profile
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_admin = true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_payment_status ON public.profiles (payment_status);
CREATE INDEX IF NOT EXISTS idx_profiles_payment_id ON public.profiles (payment_id);
CREATE INDEX IF NOT EXISTS idx_profiles_documents_verified ON public.profiles (documents_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles (is_admin);

-- Ensure RLS is enabled
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;