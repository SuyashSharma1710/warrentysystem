'use server'

import { createClient } from '@supabase/supabase-js'

export async function createAccount(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;

  if (!email || !password || !role) {
    return { error: 'Missing required fields' };
  }

  // Use the service role key to bypass RLS and create a user without logging out the admin
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyz.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_role_key',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // 1. Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return { error: authError.message };
  }

  // 2. Insert into profiles with the specific role
  if (authData.user) {
    const { error: profileError } = await supabaseAdmin.from('profiles').insert([
      { id: authData.user.id, email, role }
    ]);
    
    if (profileError) {
      return { error: profileError.message };
    }
  }

  return { success: true };
}
