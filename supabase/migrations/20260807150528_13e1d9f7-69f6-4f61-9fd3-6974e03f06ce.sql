-- shared updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- enums
CREATE TYPE public.app_role AS ENUM ('admin','user');
CREATE TYPE public.scan_status AS ENUM ('queued','running','completed','failed','cancelled');
CREATE TYPE public.risk_level AS ENUM ('Critical','High','Medium','Low','Minimal');
CREATE TYPE public.finding_severity AS ENUM ('Critical','High','Medium','Low','Informational');
CREATE TYPE public.phishing_classification AS ENUM ('Safe','Suspicious','Malicious');
CREATE TYPE public.recommendation_priority AS ENUM ('Critical','High','Medium','Low');

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON public.profiles FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- saved websites
CREATE TABLE public.saved_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  monitoring_enabled BOOLEAN NOT NULL DEFAULT false,
  last_scan_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_websites TO authenticated;
GRANT ALL ON public.saved_websites TO service_role;
ALTER TABLE public.saved_websites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_websites_own" ON public.saved_websites FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER saved_websites_updated_at BEFORE UPDATE ON public.saved_websites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_saved_websites_user ON public.saved_websites(user_id);
CREATE INDEX idx_saved_websites_domain ON public.saved_websites(domain);
CREATE INDEX idx_saved_websites_created ON public.saved_websites(created_at DESC);

-- website scans
CREATE TABLE public.website_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_website_id UUID REFERENCES public.saved_websites(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  status public.scan_status NOT NULL DEFAULT 'queued',
  security_score INTEGER,
  risk_level public.risk_level,
  ssl_status TEXT,
  scan_started_at TIMESTAMPTZ,
  scan_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.website_scans TO authenticated;
GRANT ALL ON public.website_scans TO service_role;
ALTER TABLE public.website_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "website_scans_own" ON public.website_scans FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER website_scans_updated_at BEFORE UPDATE ON public.website_scans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_scans_user ON public.website_scans(user_id);
CREATE INDEX idx_scans_domain ON public.website_scans(domain);
CREATE INDEX idx_scans_created ON public.website_scans(created_at DESC);
CREATE INDEX idx_scans_status ON public.website_scans(status);
CREATE INDEX idx_scans_risk ON public.website_scans(risk_level);

ALTER TABLE public.saved_websites
  ADD CONSTRAINT saved_websites_last_scan_fk
  FOREIGN KEY (last_scan_id) REFERENCES public.website_scans(id) ON DELETE SET NULL;

-- security findings
CREATE TABLE public.security_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES public.website_scans(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity public.finding_severity NOT NULL,
  evidence TEXT,
  recommendation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_findings TO authenticated;
GRANT ALL ON public.security_findings TO service_role;
ALTER TABLE public.security_findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "security_findings_own" ON public.security_findings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.website_scans s WHERE s.id = scan_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.website_scans s WHERE s.id = scan_id AND s.user_id = auth.uid()));
CREATE INDEX idx_findings_scan ON public.security_findings(scan_id);
CREATE INDEX idx_findings_severity ON public.security_findings(severity);
CREATE INDEX idx_findings_created ON public.security_findings(created_at DESC);

-- phishing scans
CREATE TABLE public.phishing_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  classification public.phishing_classification NOT NULL,
  confidence_score NUMERIC(5,2),
  ai_explanation TEXT,
  threat_indicators JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  provider TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.phishing_scans TO authenticated;
GRANT ALL ON public.phishing_scans TO service_role;
ALTER TABLE public.phishing_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "phishing_scans_own" ON public.phishing_scans FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_phishing_user ON public.phishing_scans(user_id);
CREATE INDEX idx_phishing_class ON public.phishing_scans(classification);
CREATE INDEX idx_phishing_created ON public.phishing_scans(created_at DESC);

-- reports
CREATE TABLE public.security_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_id UUID REFERENCES public.website_scans(id) ON DELETE SET NULL,
  report_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_reports TO authenticated;
GRANT ALL ON public.security_reports TO service_role;
ALTER TABLE public.security_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "security_reports_own" ON public.security_reports FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_reports_user ON public.security_reports(user_id);
CREATE INDEX idx_reports_created ON public.security_reports(created_at DESC);

-- ai recommendations
CREATE TABLE public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_id UUID REFERENCES public.website_scans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority public.recommendation_priority NOT NULL DEFAULT 'Medium',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_recommendations TO authenticated;
GRANT ALL ON public.ai_recommendations TO service_role;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_recommendations_own" ON public.ai_recommendations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_recs_user ON public.ai_recommendations(user_id);
CREATE INDEX idx_recs_created ON public.ai_recommendations(created_at DESC);

-- scan events
CREATE TABLE public.scan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES public.website_scans(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scan_events TO authenticated;
GRANT ALL ON public.scan_events TO service_role;
ALTER TABLE public.scan_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scan_events_own" ON public.scan_events FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.website_scans s WHERE s.id = scan_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.website_scans s WHERE s.id = scan_id AND s.user_id = auth.uid()));
CREATE INDEX idx_events_scan ON public.scan_events(scan_id);
CREATE INDEX idx_events_created ON public.scan_events(created_at DESC);