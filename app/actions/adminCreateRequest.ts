'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function adminCreateRequest(formData: FormData) {
  const customerEmail = formData.get('customerEmail') as string;
  const barcode = formData.get('barcode') as string;
  const telecallerRemarks = formData.get('telecallerRemarks') as string;
  const statusOverride = formData.get('statusOverride') as string;

  if (!customerEmail || !barcode || !statusOverride) {
    return { error: 'Customer Email, Barcode, and Status are required.' };
  }

  // Using service role for the Admin bypass (God Mode)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );

  // 1. Find Customer ID
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', customerEmail)
    .single();

  if (profileError || !profile) {
    return { error: 'Customer not found.' };
  }

  // 2. Find Warranty ID
  const { data: warranty, error: warrantyError } = await supabaseAdmin
    .from('warranties')
    .select('id')
    .eq('barcode', barcode)
    .eq('customer_id', profile.id)
    .single();

  if (warrantyError || !warranty) {
    return { error: 'Warranty not found for this customer and product.' };
  }

  // 3. Generate OTP & Insert Service Request
  const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
  const { error: insertError } = await supabaseAdmin
    .from('service_requests')
    .insert([{
      warranty_id: warranty.id,
      status: statusOverride,
      telecaller_remarks: telecallerRemarks,
      otp_code: otpCode
    }]);

  if (insertError) {
    return { error: 'Failed to create service request: ' + insertError.message };
  }

  revalidatePath('/admin');
  return { success: 'Service request created successfully by Admin!' };
}
