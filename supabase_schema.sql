-- ==========================================
-- 1. CUSTOM TYPES (ENUMS)
-- ==========================================
CREATE TYPE user_role AS ENUM ('customer', 'admin', 'telecaller', 'service_center', 'technician');

-- ==========================================
-- 2. CORE TABLES
-- ==========================================

-- Profiles Table (syncs with auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role DEFAULT 'customer'
);

-- Products Table
CREATE TABLE products (
  barcode TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  warranty_months INTEGER NOT NULL
);

-- Warranties Table
CREATE TABLE warranties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  barcode TEXT REFERENCES products(barcode) ON DELETE CASCADE,
  expiry_date DATE NOT NULL
);

-- Service Requests Table
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warranty_id UUID REFERENCES warranties(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending_call' CHECK (status IN ('pending_call', 'scheduled', 'assigned', 'closed')),
  telecaller_remarks TEXT,
  customer_availability TIMESTAMPTZ,
  assigned_center_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_tech_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  telecaller_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  otp_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. COMPUTED COLUMNS (FUNCTIONS)
-- ==========================================

-- Count total lifetime services for this specific product
CREATE OR REPLACE FUNCTION product_service_count(sr service_requests)
RETURNS integer AS $$
  SELECT count(*)::integer 
  FROM service_requests 
  WHERE warranty_id = sr.warranty_id;
$$ LANGUAGE sql STABLE;

-- Count total lifetime services for this customer across ALL their products
CREATE OR REPLACE FUNCTION customer_service_count(sr service_requests)
RETURNS integer AS $$
  SELECT count(*)::integer 
  FROM service_requests sr_join
  JOIN warranties w_join ON sr_join.warranty_id = w_join.id
  WHERE w_join.customer_id = (SELECT customer_id FROM warranties WHERE id = sr.warranty_id);
$$ LANGUAGE sql STABLE;

-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on the table
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- Allow any logged-in user to view the service requests table
CREATE POLICY "Enable read access for authenticated users" 
ON service_requests 
FOR SELECT 
TO authenticated 
USING (true);

-- ==========================================
-- FIRST TIME SETUP: CREATING THE ADMIN USER
-- ==========================================
-- By default, all new accounts are assigned the 'customer' role. 
-- To access the God-Mode Admin Dashboard, you need to manually promote 
-- your first account using the Supabase SQL Editor.
--
-- INSTRUCTIONS:
-- 1. Open your Next.js app (localhost or Vercel live link).
-- 2. Sign up as a normal user with your preferred admin email.
-- 3. Verify the email address (if email confirmations are turned on in Supabase).
-- 4. Come back to the Supabase SQL Editor and run this exact command:
--
-- UPDATE profiles 
-- SET role = 'admin' 
-- WHERE email = 'your_admin_email@example.com';
--
-- 5. Refresh your app! You are now the Admin.
--
-- NOTE: Once your first Admin account is active, you NEVER have to do this again. 
-- You can use the "Create Staff Account" tool directly inside your new 
-- Admin Dashboard to instantly generate Telecaller, Service Center, 
-- and Technician accounts!