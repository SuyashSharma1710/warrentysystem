'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addProduct(formData: FormData) {
  const barcode = formData.get('barcode') as string;
  const productName = formData.get('productName') as string;
  const warrantyMonthsStr = formData.get('warrantyMonths') as string;

  if (!barcode || !productName || !warrantyMonthsStr) {
    return { error: 'All fields are required.' };
  }

  const warrantyMonths = parseInt(warrantyMonthsStr, 10);
  if (isNaN(warrantyMonths)) {
    return { error: 'Warranty duration must be a valid number.' };
  }

  // Use the standard Supabase client as requested
  const supabase = await createClient();

  const { error } = await supabase
    .from('products')
    .insert([{
      barcode: barcode,
      product_name: productName,
      warranty_months: warrantyMonths
    }]);

  if (error) {
    // Postgres unique constraint code is 23505
    if (error.code === '23505') {
      return { error: 'A product with this barcode already exists.' };
    }
    return { error: 'System error while adding product: ' + error.message };
  }

  revalidatePath('/admin');
  
  return { success: 'Product added successfully!' };
}
