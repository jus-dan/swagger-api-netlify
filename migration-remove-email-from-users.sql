-- Migration: E-Mail-Spalte aus users Tabelle entfernen
-- Datum: $(date)
-- Beschreibung: Entfernt die doppelte E-Mail-Spalte aus der users Tabelle
--              E-Mail wird nur noch in der person Tabelle gespeichert

-- 1. Sicherheitscheck: Stelle sicher, dass alle E-Mails in der person Tabelle vorhanden sind
DO $$
DECLARE
    missing_emails INTEGER;
BEGIN
    -- Prüfe ob es Benutzer ohne entsprechende E-Mail in der person Tabelle gibt
    SELECT COUNT(*) INTO missing_emails
    FROM users u
    LEFT JOIN person p ON u.person_id = p.id
    WHERE p.email IS NULL OR p.email = '';
    
    IF missing_emails > 0 THEN
        RAISE EXCEPTION 'Es gibt % Benutzer ohne E-Mail in der person Tabelle. Migration kann nicht durchgeführt werden.', missing_emails;
    END IF;
    
    RAISE NOTICE 'Alle Benutzer haben gültige E-Mails in der person Tabelle. Migration kann durchgeführt werden.';
END $$;

-- 2. E-Mail-Spalte aus users Tabelle entfernen
ALTER TABLE users DROP COLUMN IF EXISTS email;

-- 3. Index für E-Mail entfernen (falls vorhanden)
DROP INDEX IF EXISTS idx_users_email;

-- 4. Überprüfung der Änderungen
SELECT 
    'users' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 5. Test: Stelle sicher, dass E-Mails über person Tabelle abrufbar sind
SELECT 
    u.id as user_id,
    u.username,
    p.name as person_name,
    p.email as person_email
FROM users u
JOIN person p ON u.person_id = p.id
LIMIT 5;

-- Migration erfolgreich abgeschlossen!
RAISE NOTICE 'Migration erfolgreich abgeschlossen. E-Mail-Spalte wurde aus users Tabelle entfernt.';
