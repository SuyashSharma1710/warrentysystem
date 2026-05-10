'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function customerCreateRequest(formData: FormData) {
  const barcode = formData.get('barcode') as string;
  if (!barcode) return { error: 'Barcode is required.' };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized. Please check your login session.' };
  }

  // 1. Find warranty
  const { data: warranty, error: warrantyError } = await supabase
    .from('warranties')
    .select('id, expiry_date')
    .eq('barcode', barcode)
    .eq('customer_id', user.id)
    .single();

  if (warrantyError || !warranty) {
    return { error: 'Warranty not found for this product under your account.' };
  }

  // 2. Check Expiry
  const expiryDate = new Date(warranty.expiry_date);
  const now = new Date();
  if (expiryDate < now) {
    return { error: 'Warranty has expired.' };
  }

  // 3. Generate OTP & Insert Service Request
  const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
  const { error: insertError } = await supabase
    .from('service_requests')
    .insert([{
      warranty_id: warranty.id,
      status: 'pending_call',
      otp_code: otpCode
    }]);

  if (insertError) {
    return { error: 'Failed to create service request: ' + insertError.message };
  }

  revalidatePath('/customer');
  return { success: 'Service request created successfully!' };
}
