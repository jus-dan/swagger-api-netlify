-- Makerspace Management Database Schema

-- Personen (bereits vorhanden)
CREATE TABLE IF NOT EXISTS person (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  roles TEXT[] NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Benutzer-Authentifizierung
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  person_id INTEGER REFERENCES person(id) ON DELETE CASCADE,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rollen-Definitionen
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Berechtigungen pro Rolle
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  resource_type VARCHAR(100) NOT NULL, -- 'person', 'resource', 'booking', etc.
  permission_type VARCHAR(50) NOT NULL, -- 'read', 'write', 'delete', 'admin'
  can_view BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, resource_type, permission_type)
);

-- Benutzer-Rollen-Zuordnung
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  granted_by INTEGER REFERENCES users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Session-Management
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ressourcen-Kategorien
CREATE TABLE IF NOT EXISTS resource_category (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(100),
  color VARCHAR(7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ressourcen (Maschinen, Räume, etc.)
CREATE TABLE IF NOT EXISTS resource (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id INTEGER REFERENCES resource_category(id),
  status VARCHAR(50) DEFAULT 'available', -- available, maintenance, out_of_order
  location VARCHAR(255),
  specifications JSONB, -- Flexible Spezifikationen (z.B. für Maschinen)
  image_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buchungen
CREATE TABLE IF NOT EXISTS booking (
  id SERIAL PRIMARY KEY,
  resource_id INTEGER REFERENCES resource(id) ON DELETE CASCADE,
  person_id INTEGER REFERENCES person(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, cancelled, completed
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wartungsprotokoll
CREATE TABLE IF NOT EXISTS maintenance_log (
  id SERIAL PRIMARY KEY,
  resource_id INTEGER REFERENCES resource(id) ON DELETE CASCADE,
  person_id INTEGER REFERENCES person(id),
  maintenance_type VARCHAR(100), -- routine, repair, upgrade
  description TEXT NOT NULL,
  cost DECIMAL(10,2),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- MULTI-TENANT ORGANIZATION SUPPORT
-- ========================================

-- Organizations table (Makerspaces)
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- unique identifier for URL routing
    description TEXT,
    contact_email VARCHAR(255),
    website VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    logo_url VARCHAR(500),
    subscription_plan VARCHAR(50) DEFAULT 'free', -- free, basic, premium, enterprise
    max_users INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organization settings
CREATE TABLE IF NOT EXISTS organization_settings (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, setting_key)
);

-- Extend existing tables with organization_id
ALTER TABLE person ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE resource ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE resource_category ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;

-- Organization admins (super users who can manage the organization)
CREATE TABLE IF NOT EXISTS organization_admins (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'admin', -- owner, admin, manager
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, user_id)
);

-- Organization invitations for new users
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_person_organization ON person(organization_id);
CREATE INDEX IF NOT EXISTS idx_resource_organization ON resource(organization_id);
CREATE INDEX IF NOT EXISTS idx_resource_category_organization ON resource_category(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_slug ON organizations(slug);

-- Update existing tables to set default organization for existing data
-- (This will be handled by the migration script)

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
-- EXISTING DATA INSERTIONS
-- ========================================

-- Standard-Rollen einfügen
INSERT INTO roles (name, description, is_system_role) VALUES
('admin', 'Vollzugriff auf alle Funktionen', true),
('manager', 'Verwaltung von Ressourcen und Buchungen', true),
('user', 'Standard-Benutzer mit eingeschränkten Rechten', true),
('guest', 'Gast mit nur Lese-Rechten', true)
ON CONFLICT (name) DO NOTHING;

-- Standard-Berechtigungen für Admin-Rolle
INSERT INTO role_permissions (role_id, resource_type, permission_type, can_view, can_edit, can_delete, can_create)
SELECT r.id, 'person', 'full', true, true, true, true
FROM roles r WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, resource_type, permission_type, can_view, can_edit, can_delete, can_create)
SELECT r.id, 'resource', 'full', true, true, true, true
FROM roles r WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, resource_type, permission_type, can_view, can_edit, can_delete, can_create)
SELECT r.id, 'booking', 'full', true, true, true, true
FROM roles r WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Standard-Berechtigungen für Manager-Rolle
INSERT INTO role_permissions (role_id, resource_type, permission_type, can_view, can_edit, can_delete, can_create)
SELECT r.id, 'person', 'limited', true, true, false, true
FROM roles r WHERE r.name = 'manager'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, resource_type, permission_type, can_view, can_edit, can_delete, can_create)
SELECT r.id, 'resource', 'limited', true, true, false, true
FROM roles r WHERE r.name = 'manager'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, resource_type, permission_type, can_view, can_edit, can_delete, can_create)
SELECT r.id, 'booking', 'limited', true, true, false, true
FROM roles r WHERE r.name = 'manager'
ON CONFLICT DO NOTHING;

-- Standard-Berechtigungen für User-Rolle
INSERT INTO role_permissions (role_id, resource_type, permission_type, can_view, can_edit, can_delete, can_create)
SELECT r.id, 'person', 'read_only', true, false, false, false
FROM roles r WHERE r.name = 'user'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, resource_type, permission_type, can_view, can_edit, can_delete, can_create)
SELECT r.id, 'resource', 'read_only', true, false, false, false
FROM roles r WHERE r.name = 'user'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, resource_type, permission_type, can_view, can_edit, can_delete, can_create)
SELECT r.id, 'booking', 'limited', true, true, false, true
FROM roles r WHERE r.name = 'user'
ON CONFLICT DO NOTHING;

-- Standard-Berechtigungen für Guest-Rolle
INSERT INTO role_permissions (role_id, resource_type, permission_type, can_view, can_edit, can_delete, can_create)
SELECT r.id, 'person', 'read_only', true, false, false, false
FROM roles r WHERE r.name = 'guest'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, resource_type, permission_type, can_view, can_edit, can_delete, can_create)
SELECT r.id, 'resource', 'read_only', true, false, false, false
FROM roles r WHERE r.name = 'guest'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, resource_type, permission_type, can_view, can_edit, can_delete, can_create)
SELECT r.id, 'booking', 'read_only', true, false, false, false
FROM roles r WHERE r.name = 'guest'
ON CONFLICT DO NOTHING;

-- Standard-Kategorien einfügen
INSERT INTO resource_category (name, description, icon, color) VALUES
('Maschinen', '3D-Drucker, CNC-Maschinen, Laser-Cutter', 'machine', '#FF6B6B'),
('Räume', 'Workshops, Meeting-Räume, Lager', 'room', '#4ECDC4'),
('Werkzeuge', 'Handwerkzeuge, Elektrowerkzeuge', 'tool', '#45B7D1'),
('Materialien', 'Holz, Metall, Kunststoff, Elektronik', 'material', '#96CEB4'),
('Computer', 'Laptops, Desktop-PCs, Tablets', 'computer', '#FFEAA7')
ON CONFLICT (name) DO NOTHING;

-- Trigger für updated_at (optional - kann bei Bedarf später hinzugefügt werden)
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = NOW();
--     RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- CREATE TRIGGER update_resource_updated_at BEFORE UPDATE ON resource
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexe für bessere Performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_resource ON role_permissions(role_id, resource_type);
