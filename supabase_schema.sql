-- 1. Create Role Enum
CREATE TYPE user_role AS ENUM ('customer', 'admin', 'telecaller', 'service_center', 'technician');

-- 2. Create Profiles Table (syncs with auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role DEFAULT 'customer'
);

-- 3. Create Products Table
CREATE TABLE products (
  barcode TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  warranty_months INTEGER NOT NULL
);

-- 4. Create Warranties Table
CREATE TABLE warranties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  barcode TEXT REFERENCES products(barcode) ON DELETE CASCADE,
  expiry_date DATE NOT NULL
);

-- 5. Create Service Requests Table
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warranty_id UUID REFERENCES warranties(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending_call' CHECK (status IN ('pending_call', 'scheduled', 'assigned', 'closed')),
  telecaller_remarks TEXT,
  customer_availability TIMESTAMPTZ,
  assigned_center_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_tech_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  otp_code TEXT NOT NULL
);
