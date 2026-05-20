-- ==============================================================================
-- 1. DROP EXISTING TABLES IF THEY EXIST (Lösche alte Tabellen)
-- ==============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;
DROP FUNCTION IF EXISTS public.get_email_by_username;

DROP TABLE IF EXISTS public.user_license_allocation CASCADE;
DROP TABLE IF EXISTS public.login_sessions CASCADE;
DROP TABLE IF EXISTS public.licenses CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ==============================================================================
-- 2. TABELLEN ERSTELLEN
-- ==============================================================================

-- Mitarbeiter (Beibehalten aus der alten Struktur, leicht angepasst für Referenzierung)
CREATE TABLE public.employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    company TEXT,
    department TEXT,
    position TEXT,
    status TEXT DEFAULT 'Aktiv',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Rollen Tabelle
CREATE TABLE public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    max_concurrent_licenses INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Lizenzen Tabelle
CREATE TABLE public.licenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    max_concurrent_users INTEGER,
    max_concurrent_per_role JSONB DEFAULT '{}'::jsonb,
    features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Benutzer Tabelle (Eigenes System anstelle von auth.users für mehr Kontrolle/Flexibilität)
CREATE TABLE public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    mobile TEXT,
    initials TEXT UNIQUE,
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    mitarbeiter_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE
);

-- User-License Allocation Tabelle
CREATE TABLE public.user_license_allocation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    license_id UUID REFERENCES public.licenses(id) ON DELETE CASCADE,
    allocated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Login Sessions Tabelle
CREATE TABLE public.login_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    license_id UUID REFERENCES public.licenses(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    login_timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    logout_timestamp TIMESTAMP WITH TIME ZONE,
    token_hash TEXT,
    is_active BOOLEAN DEFAULT true
);

-- ==============================================================================
-- 3. BEISPIELDATEN EINFÜGEN (Rollen & Lizenzen)
-- ==============================================================================

INSERT INTO public.roles (name, description, max_concurrent_licenses) VALUES
('Administrator', 'Alle Rechte, Systemverwaltung', 3),
('Mitarbeiter', 'Normale Nutzer', 4),
('Viewer', 'Nur Lesezugriff', 10);

INSERT INTO public.licenses (type, name, max_concurrent_users, max_concurrent_per_role) VALUES
('VOLLE_LIZENZ', 'Standard Volle Lizenz', 10, '{"Administrator": 3, "Mitarbeiter": 4}'::jsonb),
('VIEWER_LIZENZ', 'Viewer Lizenz', 10, '{"Viewer": 10}'::jsonb);

-- ==============================================================================
-- 4. RLS & POLICIES (Vereinfacht, da die Auth-Prüfung künftig über eigene JWT auf Server/Middleware läuft)
-- Wir schalten RLS für Anfragen direkt über den Client ein, aber Service-Role greift direkt zu.
-- ==============================================================================
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_license_allocation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_sessions ENABLE ROW LEVEL SECURITY;
