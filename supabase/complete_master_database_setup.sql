-- =========================================================================
-- ABECSA MASTER UNIFIED DATABASE SETUP FOR SUPABASE
-- Version: 2.0 (Complete, Idempotent, High-Performance & Super Secure)
-- Combines: Old DB Structure (Profiles, Apps, Courses, Exams, Websites,
--           User Assets, Visitor Logs, Messages, Storage)
--           + New Web Platform (Catalog, Packages, Storage Plans, Quotation Requests,
--           Interactive Demos, CRM, Invoices, Projects, Tasks, Vault, HR)
-- =========================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 2. SECURITY HELPER FUNCTIONS
-- =========================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'marketing_manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- 3. CORE USER PROFILES & AUTH EXTENSION
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name text,
  role text DEFAULT 'customer',
  email text,
  visible_password text,
  manager_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  phone text,
  avatar_url text,
  department text,
  job_title text,
  hourly_rate numeric(10,2),
  is_locked boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Safely ensure columns exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_locked') THEN
        ALTER TABLE public.profiles ADD COLUMN is_locked boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='manager_id') THEN
        ALTER TABLE public.profiles ADD COLUMN manager_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='department') THEN
        ALTER TABLE public.profiles ADD COLUMN department text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='job_title') THEN
        ALTER TABLE public.profiles ADD COLUMN job_title text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='hourly_rate') THEN
        ALTER TABLE public.profiles ADD COLUMN hourly_rate numeric(10,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='created_at') THEN
        ALTER TABLE public.profiles ADD COLUMN created_at timestamptz DEFAULT now();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'marketing_manager', 'customer', 'student_ambassador', 'student', 'engineer'));

-- Trigger to automatically create profile on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =========================================================================
-- 4. APPS TABLE & APP DOWNLOADS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  version text DEFAULT '1.0',
  category text DEFAULT 'General',
  icon_url text,
  apk_url text NOT NULL,
  apk_filename text,
  download_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- App download counter function
CREATE OR REPLACE FUNCTION public.increment_app_download(app_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.apps SET download_count = download_count + 1 WHERE id = app_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- 5. COURSE & INTERNSHIP APPLICATIONS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.course_applications (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  course_name text NOT NULL,
  branch text,
  message text,
  status text DEFAULT 'Pending',
  type text DEFAULT 'Course',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='course_applications' AND column_name='type') THEN
        ALTER TABLE public.course_applications ADD COLUMN type text DEFAULT 'Course';
    END IF;
END $$;

-- =========================================================================
-- 6. WEBSITES TABLE (MANAGED CLIENT SITES & DIRECTORY)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.websites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  manager_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  url text NOT NULL,
  description text,
  category text DEFAULT 'General',
  icon_url text,
  status text DEFAULT 'Active',
  plan text DEFAULT 'Standard Cloud NVMe',
  expiry_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='websites' AND column_name='description') THEN
        ALTER TABLE public.websites ADD COLUMN description text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='websites' AND column_name='icon_url') THEN
        ALTER TABLE public.websites ADD COLUMN icon_url text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='websites' AND column_name='is_active') THEN
        ALTER TABLE public.websites ADD COLUMN is_active boolean DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='websites' AND column_name='category') THEN
        ALTER TABLE public.websites ADD COLUMN category text DEFAULT 'General';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='websites' AND column_name='user_id') THEN
        ALTER TABLE public.websites ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='websites' AND column_name='manager_id') THEN
        ALTER TABLE public.websites ADD COLUMN manager_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='websites' AND column_name='status') THEN
        ALTER TABLE public.websites ADD COLUMN status text DEFAULT 'Active';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='websites' AND column_name='plan') THEN
        ALTER TABLE public.websites ADD COLUMN plan text DEFAULT 'Standard Cloud NVMe';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='websites' AND column_name='expiry_date') THEN
        ALTER TABLE public.websites ADD COLUMN expiry_date date;
    END IF;
END $$;

-- =========================================================================
-- 7. USER ASSETS (LICENSES, CERTIFICATES, SECURE KEYS)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.user_assets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  value text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_assets DROP CONSTRAINT IF EXISTS user_assets_type_check;
ALTER TABLE public.user_assets ADD CONSTRAINT user_assets_type_check CHECK (type IN ('License', 'Certificate', 'Image', 'Key', 'Document'));

-- =========================================================================
-- 8. VISITOR LOGS & SITE ANALYTICS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.visitor_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  image_url text NOT NULL,
  visitor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.site_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path text NOT NULL,
  visitor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- =========================================================================
-- 9. EXAMS & PROCTORING ATTEMPTS (STUDENT AMBASSADORS & RECRUITMENT)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.exams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  google_form_url text NOT NULL,
  start_time timestamp with time zone NOT NULL,
  duration_minutes integer NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exam_id uuid REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  status text CHECK (status IN ('started', 'completed', 'flagged')) DEFAULT 'started',
  violation_reason text,
  started_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at timestamp with time zone,
  UNIQUE(user_id, exam_id)
);

-- =========================================================================
-- 10. MESSAGES & LIVE CHAT
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id uuid,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- =========================================================================
-- 11. SOLUTIONS ENGINE & PRICING CATALOG (NEW WEB PLATFORM)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.catalog_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  short_description text NOT NULL,
  full_description text,
  icon text,
  image_url text,
  base_price numeric(10,2) NOT NULL DEFAULT 0,
  recurring_price numeric(10,2) NOT NULL DEFAULT 0,
  recurring_interval text DEFAULT 'MONTHLY',
  is_price_on_request boolean DEFAULT false,
  key_features text NOT NULL DEFAULT '[]', -- JSON string
  configurable_addons text DEFAULT '[]',   -- JSON string
  suitable_for text,
  recommended_database_tier text,
  deployment_options text,
  pricing_model text DEFAULT 'ONE_TIME',
  shared_module_ids text,
  compatible_product_ids text,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.catalog_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  tagline text,
  description text,
  badge text,
  base_price numeric(10,2) NOT NULL DEFAULT 0,
  recurring_price numeric(10,2) NOT NULL DEFAULT 0,
  recurring_interval text DEFAULT 'MONTHLY',
  discount_amount numeric(10,2) NOT NULL DEFAULT 0,
  included_product_codes text NOT NULL DEFAULT '[]', -- JSON string
  included_features text NOT NULL DEFAULT '[]',      -- JSON string
  database_tier text,
  user_limit text,
  product_limit text,
  support_tier text,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.database_storage_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  size_gb integer UNIQUE NOT NULL,
  label text NOT NULL,
  monthly_price numeric(10,2) NOT NULL DEFAULT 0,
  annual_price numeric(10,2) NOT NULL DEFAULT 0,
  storage_type text DEFAULT 'NVMe SSD Cloud Storage',
  recommended_business_size text,
  backup_info text DEFAULT 'Daily automated cloud snapshots with 30-day retention',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.storage_estimator_rules (
  id text PRIMARY KEY DEFAULT 'default-rule',
  avg_image_size_bytes integer DEFAULT 307200,      -- 300 KB
  avg_product_record_bytes integer DEFAULT 4096,    -- 4 KB
  avg_customer_record_bytes integer DEFAULT 2048,   -- 2 KB
  avg_bill_record_bytes integer DEFAULT 3072,       -- 3 KB
  avg_bill_item_record_bytes integer DEFAULT 512,   -- 512 bytes
  overhead_and_index_factor numeric(4,2) DEFAULT 1.35,
  safety_buffer_percent numeric(5,2) DEFAULT 20.0,
  external_storage_notice text DEFAULT 'Product images are stored securely on Cloud Object Storage (CDN), preserving primary database performance.',
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.software_quotation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  business_name text,
  email text NOT NULL,
  phone text NOT NULL,
  city text,
  business_type text,
  preferred_contact text DEFAULT 'WHATSAPP',
  selected_products text NOT NULL, -- JSON array
  selected_database_tier text,
  website_requirements text,      -- JSON
  one_time_total numeric(12,2) DEFAULT 0,
  recurring_total numeric(12,2) DEFAULT 0,
  recurring_interval text DEFAULT 'ANNUALLY',
  discount_total numeric(12,2) DEFAULT 0,
  tax_amount numeric(12,2) DEFAULT 0,
  grand_total numeric(12,2) DEFAULT 0,
  status text DEFAULT 'NEW',
  internal_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.interactive_demos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  tagline text NOT NULL,
  description text NOT NULL,
  tech_stack text NOT NULL DEFAULT '[]',
  key_features text NOT NULL DEFAULT '[]',
  preview_url text NOT NULL,
  image_url text,
  metrics text,
  is_active boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =========================================================================
-- 12. CRM, PROJECTS, INVOICING & VAULT
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text,
  email text,
  phone text,
  source text,
  status text DEFAULT 'NEW',
  priority text DEFAULT 'MEDIUM',
  deal_value numeric(12,2) DEFAULT 0,
  service_interest text,
  assigned_manager_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  manager_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  service_category text NOT NULL,
  budget numeric(12,2) DEFAULT 0,
  priority text DEFAULT 'MEDIUM',
  status text DEFAULT 'PLANNING',
  start_date date,
  delivery_date date,
  tech_stack text,
  progress integer DEFAULT 0,
  requirements text,
  staging_url text,
  repo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'TODO',
  priority text DEFAULT 'MEDIUM',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date date,
  estimated_hours numeric(6,2),
  actual_hours numeric(6,2),
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  status text DEFAULT 'DRAFT',
  issue_date date DEFAULT CURRENT_DATE,
  due_date date,
  subtotal numeric(12,2) DEFAULT 0,
  discount numeric(12,2) DEFAULT 0,
  tax_amount numeric(12,2) DEFAULT 0,
  total_amount numeric(12,2) DEFAULT 0,
  paid_amount numeric(12,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subject text NOT NULL,
  description text NOT NULL,
  priority text DEFAULT 'MEDIUM',
  status text DEFAULT 'OPEN',
  category text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scratch_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  discount_text text NOT NULL,
  promo_code text NOT NULL,
  service_name text,
  is_claimed boolean DEFAULT false,
  claimed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.company_settings (
  id text PRIMARY KEY DEFAULT 'primary',
  company_name text NOT NULL DEFAULT 'ABECSA Software Solutions',
  tagline text DEFAULT 'Architecting Next-Generation Enterprise Systems',
  email text DEFAULT 'contact@abecsa.in',
  phone text DEFAULT '+91 98765 43210',
  address text,
  gstin text,
  currency text DEFAULT 'INR',
  logo_url text,
  favicon_url text,
  whatsapp_number text DEFAULT '919876543210',
  website_url text DEFAULT 'https://abecsa.in',
  updated_at timestamptz DEFAULT now()
);

-- =========================================================================
-- 13. ROW LEVEL SECURITY (RLS) - CLEAN SLATE & HARMONIZATION
-- =========================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_storage_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_estimator_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software_quotation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactive_demos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scratch_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies safely
DO $$ 
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN (
          'profiles', 'apps', 'course_applications', 'websites', 'user_assets', 
          'visitor_logs', 'site_analytics', 'exams', 'exam_attempts', 'messages',
          'catalog_products', 'catalog_packages', 'database_storage_plans', 
          'storage_estimator_rules', 'software_quotation_requests', 'interactive_demos',
          'crm_leads', 'projects', 'tasks', 'invoices', 'support_tickets', 
          'scratch_gifts', 'company_settings'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', rec.policyname, rec.tablename);
    END LOOP;
END $$;

-- 1. Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins manage all profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- 2. Apps Policies
CREATE POLICY "Public can read active apps" ON public.apps FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage apps" ON public.apps FOR ALL USING (public.is_admin());

-- 3. Course Applications Policies
CREATE POLICY "Anyone can submit course applications" ON public.course_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Managers and Admins view course applications" ON public.course_applications FOR SELECT USING (public.is_manager_or_admin());
CREATE POLICY "Managers and Admins update course applications" ON public.course_applications FOR UPDATE USING (public.is_manager_or_admin());
CREATE POLICY "Admins delete course applications" ON public.course_applications FOR DELETE USING (public.is_admin());

-- 4. Websites Policies
CREATE POLICY "Public can read active websites" ON public.websites FOR SELECT USING (is_active = true);
CREATE POLICY "Users view own websites" ON public.websites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers view assigned websites" ON public.websites FOR SELECT USING (auth.uid() = manager_id);
CREATE POLICY "Admins manage all websites" ON public.websites FOR ALL USING (public.is_admin());

-- 5. User Assets Policies
CREATE POLICY "Users view own assets" ON public.user_assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own assets" ON public.user_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage assets" ON public.user_assets FOR ALL USING (public.is_admin());

-- 6. Visitor Logs & Site Analytics Policies
CREATE POLICY "Allow public insert to visitor_logs" ON public.visitor_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Managers and Admins view visitor_logs" ON public.visitor_logs FOR SELECT USING (public.is_manager_or_admin());
CREATE POLICY "Admins manage visitor_logs" ON public.visitor_logs FOR ALL USING (public.is_admin());

CREATE POLICY "Allow public insert to site_analytics" ON public.site_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Managers and Admins view site_analytics" ON public.site_analytics FOR SELECT USING (public.is_manager_or_admin());

-- 7. Exams & Exam Attempts Policies
CREATE POLICY "Exams viewable by everyone" ON public.exams FOR SELECT USING (true);
CREATE POLICY "Admins manage exams" ON public.exams FOR ALL USING (public.is_admin());

CREATE POLICY "Users view own attempts" ON public.exam_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own attempts" ON public.exam_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own attempts" ON public.exam_attempts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage attempts" ON public.exam_attempts FOR ALL USING (public.is_admin());

-- 8. Messages Policies
CREATE POLICY "Users view own conversation messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR public.is_manager_or_admin());
CREATE POLICY "Users insert messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Admins manage messages" ON public.messages FOR ALL USING (public.is_admin());

-- 9. Catalog, Solutions & Demos Policies
CREATE POLICY "Public can view catalog products" ON public.catalog_products FOR SELECT USING (true);
CREATE POLICY "Admins manage catalog products" ON public.catalog_products FOR ALL USING (public.is_admin());

CREATE POLICY "Public can view catalog packages" ON public.catalog_packages FOR SELECT USING (true);
CREATE POLICY "Admins manage catalog packages" ON public.catalog_packages FOR ALL USING (public.is_admin());

CREATE POLICY "Public can view storage plans" ON public.database_storage_plans FOR SELECT USING (true);
CREATE POLICY "Admins manage storage plans" ON public.database_storage_plans FOR ALL USING (public.is_admin());

CREATE POLICY "Public can view estimator rules" ON public.storage_estimator_rules FOR SELECT USING (true);
CREATE POLICY "Admins manage estimator rules" ON public.storage_estimator_rules FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can submit quotation requests" ON public.software_quotation_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Managers and Admins view quotation requests" ON public.software_quotation_requests FOR SELECT USING (public.is_manager_or_admin());
CREATE POLICY "Managers and Admins update quotation requests" ON public.software_quotation_requests FOR UPDATE USING (public.is_manager_or_admin());
CREATE POLICY "Admins delete quotation requests" ON public.software_quotation_requests FOR DELETE USING (public.is_admin());

CREATE POLICY "Public can view active demos" ON public.interactive_demos FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage interactive demos" ON public.interactive_demos FOR ALL USING (public.is_admin());

-- 10. CRM, Invoices, Projects Policies
CREATE POLICY "Public can create leads" ON public.crm_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Managers and Admins manage leads" ON public.crm_leads FOR ALL USING (public.is_manager_or_admin());

CREATE POLICY "Customers view own projects" ON public.projects FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Managers view assigned projects" ON public.projects FOR SELECT USING (auth.uid() = manager_id);
CREATE POLICY "Admins manage projects" ON public.projects FOR ALL USING (public.is_admin());

CREATE POLICY "Team and customers view project tasks" ON public.tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = tasks.project_id
    AND (p.customer_id = auth.uid() OR p.manager_id = auth.uid() OR public.is_admin())
  )
);
CREATE POLICY "Admins and managers manage tasks" ON public.tasks FOR ALL USING (public.is_manager_or_admin());

CREATE POLICY "Customers view own invoices" ON public.invoices FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Managers and Admins manage invoices" ON public.invoices FOR ALL USING (public.is_manager_or_admin());

CREATE POLICY "Customers view own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Customers insert tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Managers and Admins manage tickets" ON public.support_tickets FOR ALL USING (public.is_manager_or_admin());

CREATE POLICY "Public can view unclaimed gifts" ON public.scratch_gifts FOR SELECT USING (true);
CREATE POLICY "Users can claim scratch gifts" ON public.scratch_gifts FOR UPDATE USING (auth.uid() = claimed_by OR claimed_by IS NULL);
CREATE POLICY "Admins manage scratch gifts" ON public.scratch_gifts FOR ALL USING (public.is_admin());

CREATE POLICY "Public view company settings" ON public.company_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage company settings" ON public.company_settings FOR ALL USING (public.is_admin());

-- =========================================================================
-- 14. STORAGE BUCKETS & POLICIES
-- =========================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('public-files', 'public-files', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('visitor-captures', 'visitor-captures', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('apps-files', 'apps-files', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('vault-assets', 'vault-assets', false) ON CONFLICT (id) DO UPDATE SET public = false;
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT (id) DO UPDATE SET public = true;

DO $$ 
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', rec.policyname);
    END LOOP;
END $$;

CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT USING ( bucket_id IN ('public-files', 'visitor-captures', 'apps-files', 'documents') );
CREATE POLICY "Authenticated Upload Access" ON storage.objects FOR INSERT WITH CHECK ( (bucket_id IN ('public-files', 'apps-files', 'documents')) AND auth.role() = 'authenticated' );
CREATE POLICY "Public Visitor Capture Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'visitor-captures' );
CREATE POLICY "Users Read Own Vault Assets" ON storage.objects FOR SELECT USING ( bucket_id = 'vault-assets' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin()) );
CREATE POLICY "Users Upload Own Vault Assets" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'vault-assets' AND auth.uid()::text = (storage.foldername(name))[1] );
CREATE POLICY "Admin Full Storage Access" ON storage.objects FOR ALL USING ( public.is_admin() );

-- =========================================================================
-- 15. PERFORMANCE INDEXES (SUB-10MS QUERY SPEED)
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_apps_active ON public.apps(is_active);
CREATE INDEX IF NOT EXISTS idx_websites_user_id ON public.websites(user_id);
CREATE INDEX IF NOT EXISTS idx_websites_active ON public.websites(is_active);
CREATE INDEX IF NOT EXISTS idx_user_assets_user_id ON public.user_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_created_at ON public.visitor_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_analytics_created_at ON public.site_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user_exam ON public.exam_attempts(user_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_catalog_products_code ON public.catalog_products(code);
CREATE INDEX IF NOT EXISTS idx_catalog_products_featured ON public.catalog_products(is_featured);
CREATE INDEX IF NOT EXISTS idx_software_quotations_req ON public.software_quotation_requests(request_number);
CREATE INDEX IF NOT EXISTS idx_software_quotations_status ON public.software_quotation_requests(status);
CREATE INDEX IF NOT EXISTS idx_projects_customer_id ON public.projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);

-- =========================================================================
-- 16. SEED ESSENTIAL BASELINE DATA (IDEMPOTENT)
-- =========================================================================
INSERT INTO public.database_storage_plans (size_gb, label, monthly_price, annual_price, recommended_business_size, backup_info)
VALUES 
  (0, 'Customer Own Server (Self-Hosted)', 0, 0, 'Bring your own MySQL/PostgreSQL server', 'Managed on customer infrastructure'),
  (1, '1 GB Cloud NVMe SSD', 49, 399, 'Single Counter Retail Shop', 'Daily Cloud Backup, 7-Day History'),
  (2, '2 GB Cloud NVMe SSD', 99, 799, 'Busy Retail Store & Supermarket', 'Daily Cloud Backup, 15-Day History'),
  (5, '5 GB Cloud NVMe SSD (Recommended)', 199, 1699, 'Multi-Counter Store, Restaurant & Pharmacy', 'Daily Cloud Backup, 30-Day History'),
  (10, '10 GB Cloud NVMe SSD', 399, 3199, 'Multi-Branch Wholesale & Distribution', 'Twice-Daily Backup, 60-Day History'),
  (15, '15 GB Cloud NVMe SSD', 549, 4499, 'High-Frequency Catalog & E-Commerce Store', 'Real-Time Replication + 90-Day History'),
  (25, '25 GB Cloud NVMe SSD', 849, 6999, 'Enterprise Logistics, Factory & Campus ERP', 'Multi-Region High Availability Cluster')
ON CONFLICT (size_gb) DO UPDATE SET
  label = EXCLUDED.label,
  annual_price = EXCLUDED.annual_price,
  monthly_price = EXCLUDED.monthly_price;

INSERT INTO public.company_settings (id, company_name, email, phone, whatsapp_number)
VALUES ('primary', 'ABECSA Software Solutions', 'contact@abecsa.in', '+91 98765 43210', '919876543210')
ON CONFLICT (id) DO NOTHING;

-- SUCCESS
COMMENT ON FUNCTION public.is_admin IS 'ABECSA Security Function: Checks if the calling user has role admin';
