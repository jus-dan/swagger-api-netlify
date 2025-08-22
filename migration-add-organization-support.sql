-- ========================================
-- MIGRATION: Organization Support hinzufügen
-- ========================================
-- 
-- Dieses Skript fügt Multi-Tenant-Organisationsunterstützung
-- zu bestehenden Makerspace-Datenbanken hinzu.
--
-- AUSFÜHRUNG:
-- 1. Sichere deine Datenbank
-- 2. Führe dieses Skript in Supabase aus
-- 3. Überprüfe die Ergebnisse
-- ========================================

-- Neue Tabellen erstellen
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    contact_email VARCHAR(255),
    website VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    logo_url VARCHAR(500),
    subscription_plan VARCHAR(50) DEFAULT 'free',
    max_users INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organization_settings (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, setting_key)
);

CREATE TABLE IF NOT EXISTS organization_admins (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'admin',
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS organization_invitations (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    invited_by INTEGER REFERENCES users(id),
    role VARCHAR(50) DEFAULT 'user',
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- PASSWORD RESET TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS password_resets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Index für schnelle Token-Suche
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_resets(expires_at);

-- Trigger für updated_at
CREATE TRIGGER IF NOT EXISTS update_password_resets_updated_at BEFORE UPDATE ON password_resets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- EXISTING DATA ASSIGNMENT
-- ========================================

-- Bestehende Tabellen erweitern
ALTER TABLE person ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE resource ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE resource_category ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;

-- Indexe für Performance
CREATE INDEX IF NOT EXISTS idx_person_organization ON person(organization_id);
CREATE INDEX IF NOT EXISTS idx_resource_organization ON resource(organization_id);
CREATE INDEX IF NOT EXISTS idx_resource_category_organization ON resource_category(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_slug ON organizations(slug);

-- Standard-Organisation für bestehende Daten erstellen
INSERT INTO organizations (name, slug, description, contact_email, subscription_plan)
VALUES (
    'Standard Makerspace',
    'default-makerspace',
    'Standard-Organisation für bestehende Daten',
    'admin@default-makerspace.com',
    'free'
) ON CONFLICT (slug) DO NOTHING;

-- Standard-Organisations-ID abrufen
DO $$
DECLARE
    default_org_id INTEGER;
BEGIN
    SELECT id INTO default_org_id FROM organizations WHERE slug = 'default-makerspace';
    
    -- Alle bestehenden Daten der Standard-Organisation zuweisen
    UPDATE person SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE resource SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE resource_category SET organization_id = default_org_id WHERE organization_id IS NULL;
    
    -- Alle bestehenden Admin-Benutzer als Organisations-Admins eintragen
    INSERT INTO organization_admins (organization_id, user_id, role)
    SELECT default_org_id, u.id, 'owner'
    FROM users u
    INNER JOIN user_roles ur ON u.id = ur.user_id
    INNER JOIN roles r ON ur.role_id = r.id
    WHERE r.name = 'admin'
    ON CONFLICT (organization_id, user_id) DO NOTHING;
    
    RAISE NOTICE 'Standard-Organisation erstellt und bestehende Daten zugewiesen. Organisations-ID: %', default_org_id;
END $$;

-- Überprüfung der Migration
SELECT 
    'Organizations' as table_name,
    COUNT(*) as record_count
FROM organizations
UNION ALL
SELECT 
    'Person mit Organization' as table_name,
    COUNT(*) as record_count
FROM person WHERE organization_id IS NOT NULL
UNION ALL
SELECT 
    'Resources mit Organization' as table_name,
    COUNT(*) as record_count
FROM resource WHERE organization_id IS NOT NULL
UNION ALL
SELECT 
    'Resource Categories mit Organization' as table_name,
    COUNT(*) as record_count
FROM resource_category WHERE organization_id IS NOT NULL
UNION ALL
SELECT 
    'Organization Admins' as table_name,
    COUNT(*) as record_count
FROM organization_admins;

-- Hinweis für den Benutzer
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRATION ERFOLGREICH ABGESCHLOSSEN!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Nächste Schritte:';
    RAISE NOTICE '1. Alle bestehenden Daten sind der Standard-Organisation zugewiesen';
    RAISE NOTICE '2. Alle Admin-Benutzer sind als Organisations-Admins eingetragen';
    RAISE NOTICE '3. Neue Makerspaces können über die Organization API registriert werden';
    RAISE NOTICE '4. Bestehende Daten bleiben unverändert und funktionsfähig';
    RAISE NOTICE '';
    RAISE NOTICE 'Standard-Organisation: "Standard Makerspace" (Slug: default-makerspace)';
    RAISE NOTICE '========================================';
END $$;
