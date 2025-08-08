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

-- Standard-Kategorien einfügen
INSERT INTO resource_category (name, description, icon, color) VALUES
('Maschinen', '3D-Drucker, CNC-Maschinen, Laser-Cutter', 'machine', '#FF6B6B'),
('Räume', 'Workshops, Meeting-Räume, Lager', 'room', '#4ECDC4'),
('Werkzeuge', 'Handwerkzeuge, Elektrowerkzeuge', 'tool', '#45B7D1'),
('Materialien', 'Holz, Metall, Kunststoff, Elektronik', 'material', '#96CEB4'),
('Computer', 'Laptops, Desktop-PCs, Tablets', 'computer', '#FFEAA7');

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_resource_updated_at BEFORE UPDATE ON resource
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
