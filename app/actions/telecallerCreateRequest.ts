'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function telecallerCreateRequest(formData: FormData) {
  const customerEmail = formData.get('customerEmail') as string;
  const barcode = formData.get('barcode') as string;
  const telecallerRemarks = formData.get('telecallerRemarks') as string;

  if (!customerEmail || !barcode) {
    return { error: 'Customer Email and Barcode are required.' };
  }

  // NOTE: Telecallers must use the standard client (assumed they have access to profiles/warranties)
  // If RLS prevents this, we might need a stored procedure or service role, but standard implementation first:
  const supabase = await createClient();

  // 1. Find Customer ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', customerEmail)
    .single();

  if (profileError || !profile) {
    // If RLS prevents telecaller from reading profiles, this will fail. Let's see.
    return { error: 'Customer not found or access denied.' };
  }

  // 2. Find Warranty ID
  const { data: warranty, error: warrantyError } = await supabase
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
  const { error: insertError } = await supabase
    .from('service_requests')
    .insert([{
      warranty_id: warranty.id,
      status: 'pending_call',
      telecaller_remarks: telecallerRemarks,
      otp_code: otpCode
    }]);

  if (insertError) {
    return { error: 'Failed to create service request: ' + insertError.message };
  }

  revalidatePath('/telecaller');
  return { success: 'Service request created successfully!' };
}
