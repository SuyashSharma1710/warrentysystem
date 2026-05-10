'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function registerWarranty(formData: FormData) {
  const barcode = formData.get('barcode') as string;
  const customerEmail = formData.get('customerEmail') as string;

  if (!barcode || !customerEmail) {
    return { error: 'Barcode and Customer Email are required.' };
  }

  // Use the service role key to bypass RLS and securely verify customer profiles
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // 1. Validate Product Barcode
  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .select('warranty_months')
    .eq('barcode', barcode)
    .single();

  if (productError || !product) {
    return { error: 'Product not found.' };
  }

  // 2. Validate Customer Profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', customerEmail)
    .single();

  if (profileError || !profile) {
    return { error: 'Customer not found. Please ensure they have registered an account.' };
  }

  // 3. Calculate Expiry Date
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + product.warranty_months);

  // 4. Insert Warranty
  const { error: insertError } = await supabaseAdmin
    .from('warranties')
    .insert([{
      customer_id: profile.id,
      barcode: barcode,
      expiry_date: expiryDate.toISOString().split('T')[0]
    }]);

  if (insertError) {
    return { error: 'System error while registering warranty: ' + insertError.message };
  }

  revalidatePath('/admin');
  
  return { success: 'Warranty registered successfully!' };
}
