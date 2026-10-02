/* ============================================================
   SUPABASE CONFIG
   ============================================================ */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://tiokyomdsfgdloyxiazc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpb2t5b21kc2ZnZGxveXhpYXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4OTMyMDksImV4cCI6MjEwNjQ2OTIwOX0.HJwTC3sgDfofEHaidpM2H3O7dGDnpcUdGttM5dTsLR8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);