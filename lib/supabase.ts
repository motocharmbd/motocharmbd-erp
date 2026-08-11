import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
export const formatInvoiceId = (uuid: string) => {
  return `MCB-${uuid.slice(0, 6).toUpperCase()}`;
};