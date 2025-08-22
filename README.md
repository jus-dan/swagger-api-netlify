# 🏭 Makerspace Verwaltung - Vollständiges System mit Login und Rollen

Ein vollständiges Verwaltungssystem für Makerspaces mit Benutzer-Authentifizierung, rollenbasierten Berechtigungen und umfassendem Admin-Interface.

## 🚀 Features

### 🏢 **Multi-Tenant Organisationen**
- **Eigene Makerspace-Instanz** für jeden Kunden
- **Isolierte Daten** pro Organisation
- **Organisations-Registrierung** über öffentliche API
- **Admin-Panel** pro Organisation
- **Benutzer-Einladungssystem** für neue Mitglieder
- **Skalierbare Architektur** für kommerzielle Nutzung

### 🔐 Authentifizierung & Sicherheit
- **Benutzer-Login/Logout** mit JWT-Token
- **Registrierung** neuer Benutzer
- **Session-Management** mit Datenbank-Überprüfung
- **Passwort-Hashing** mit bcrypt

### 🎭 Rollen-basiertes Berechtigungssystem
- **4 Standard-Rollen**: Admin, Manager, User, Guest
- **Granulare Berechtigungen** pro Ressourcentyp:
  - `can_view` - Anzeigen erlaubt
  - `can_edit` - Bearbeiten erlaubt
  - `can_delete` - Löschen erlaubt
  - `can_create` - Erstellen erlaubt
- **Admin-Interface** für Rollen- und Berechtigungsverwaltung
- **Dynamische Sichtbarkeiten** basierend auf Benutzerrollen

### 📊 Verwaltungsfunktionen
- **Personenverwaltung** mit Rollen
- **Ressourcenverwaltung** (Maschinen, Räume, Werkzeuge)
- **Kategorienverwaltung** für Ressourcen
- **Dashboard** mit Übersichten und Statistiken

## 🏗️ Technologie-Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express + Netlify Functions
- **Datenbank**: Supabase (PostgreSQL)
- **Authentifizierung**: JWT + bcrypt
- **API-Dokumentation**: Swagger/OpenAPI
- **Deployment**: Netlify

## 🗄️ Datenbankstruktur

### Tabellen-Design
- **`person`**: Zentrale Tabelle für alle Personen-Informationen (Name, E-Mail, Rollen)
- **`users`**: Authentifizierungsdaten (Username, Passwort-Hash, Verknüpfung zu person)
- **`roles`**: Rollen-Definitionen (Admin, Manager, User, Guest)
- **`role_permissions`**: Granulare Berechtigungen pro Rolle und Ressourcentyp
- **`user_roles`**: Verknüpfung zwischen Benutzern und Rollen

### Datenkonsistenz
- **E-Mail wird nur in `person` Tabelle gespeichert** (Normalisierung)
- **`users` Tabelle** verweist über `person_id` auf die `person` Tabelle
- **Keine doppelten E-Mail-Spalten** → Vermeidung von Dateninkonsistenzen

## 📋 Installation & Setup

### 1. Repository klonen
```bash
git clone https://github.com/jus-dan/swagger-api-netlify.git
cd swagger-api-netlify
```

### 2. Abhängigkeiten installieren
```bash
npm install
cd frontend && npm install && cd ..
```

### 3. Umgebungsvariablen konfigurieren
Erstelle eine `.env` Datei im Root-Verzeichnis:
```env
SUPABASE_URL=deine_supabase_url
SUPABASE_KEY=dein_supabase_service_key
JWT_SECRET=dein_jwt_secret_key
```

### 4. Datenbank-Schema einrichten
Führe das SQL-Schema in deiner Supabase-Datenbank aus:
```bash
# Kopiere den Inhalt von database-schema.sql
# und führe ihn in der Supabase SQL Editor aus
```

### 5. Migration (falls bestehende Datenbank)
Falls du bereits eine bestehende Datenbank mit doppelten E-Mail-Spalten hast:
```bash
# Führe das Migrationsskript aus:
# migration-remove-email-from-users.sql
```

### 6. Multi-Tenant Support hinzufügen (optional)
Falls du Multi-Tenant-Organisationsunterstützung benötigst:
```bash
# Führe das Organisations-Migrationsskript aus:
# migration-add-organization-support.sql
```

### 5. Entwicklungsserver starten
```bash
npm run dev
```

## 🔧 Verwendung

### Erste Schritte
1. **Registriere einen Admin-Benutzer** über die API:
   ```bash
   POST /.netlify/functions/auth/register
   {
     "username": "admin",
     "password": "admin123",
     "email": "admin@makerspace.com",
     "name": "Administrator"
   }
   ```

2. **Melde dich an** über die Weboberfläche
3. **Verwalte Rollen und Berechtigungen** im Admin-Bereich

### Standard-Rollen & Berechtigungen

#### 👑 Admin
- **Vollzugriff** auf alle Funktionen
- Kann Rollen und Berechtigungen verwalten
- Kann alle Benutzer verwalten

#### 👨‍💼 Manager
- **Verwaltung** von Ressourcen und Buchungen
- Kann Personen bearbeiten (nicht löschen)
- Kann neue Ressourcen erstellen

#### 👤 User
- **Lese-Zugriff** auf Personen und Ressourcen
- Kann eigene Buchungen verwalten
- **Keine** Lösch-Berechtigungen

#### 👥 Guest
- **Nur Lese-Zugriff** auf alle Daten
- **Keine** Bearbeitungsrechte

## 📚 API-Endpunkte

### 🔐 Authentifizierung
- `POST /auth/login` - Benutzer anmelden
- `POST /auth/logout` - Benutzer abmelden
- `POST /auth/register` - Neuen Benutzer registrieren
- `GET /auth/me` - Aktuelle Benutzer-Informationen
- `GET /auth/roles` - Alle verfügbaren Rollen
- `GET /auth/permissions` - Berechtigungen für eine Rolle
- `PUT /auth/permissions` - Berechtigungen aktualisieren

### 🏢 Organisationen (Multi-Tenant)
- `POST /organization/register` - Neuen Makerspace registrieren (öffentlich)
- `GET /organization/profile` - Organisations-Profil abrufen
- `PUT /organization/profile` - Organisations-Profil aktualisieren
- `POST /organization/invite` - Benutzer zur Organisation einladen
- `GET /organization/public/:slug` - Öffentliche Organisations-Informationen
- `GET /organization/admin/organizations` - Alle Organisationen (Super Admin)

### ⚙️ Admin-Funktionen
- `GET /admin/roles` - Alle Rollen mit Berechtigungen
- `POST /admin/roles` - Neue Rolle erstellen
- `PUT /admin/roles/:id` - Rolle bearbeiten
- `DELETE /admin/roles/:id` - Rolle löschen
- `GET /admin/permissions` - Alle Berechtigungen
- `PUT /admin/permissions/bulk` - Mehrere Berechtigungen aktualisieren
- `GET /admin/users` - Alle Benutzer mit Rollen
- `PUT /admin/users/:id/roles` - Benutzer-Rollen zuweisen

### 👥 Personenverwaltung
- `GET /person` - Alle Personen abrufen
- `GET /person/:id` - Einzelne Person abrufen
- `POST /person` - Neue Person erstellen
- `PUT /person/:id` - Person bearbeiten
- `DELETE /person/:id` - Person löschen

## 🌐 Deployment

### Netlify
Das System ist für Netlify optimiert:
- **Automatisches Deployment** bei Git-Push
- **Serverless Functions** für Backend-APIs
- **CDN** für Frontend-Assets

### Produktionsumgebung
1. **JWT_SECRET** in Netlify-Umgebungsvariablen setzen
2. **Supabase-Credentials** konfigurieren
3. **Domain** in Netlify einrichten

## 🔒 Sicherheitsfeatures

- **JWT-Token** mit 24h Gültigkeit
- **Session-Überprüfung** in der Datenbank
- **Passwort-Hashing** mit bcrypt (12 Runden)
- **Rollen-basierte Zugriffskontrolle** (RBAC)
- **CORS-Konfiguration** für sichere API-Aufrufe
- **Datenkonsistenz** durch Normalisierung (E-Mail nur in person Tabelle)

## 📖 Dokumentation

- **Swagger UI**: `/swagger.html`
- **Auth API Docs**: `/.netlify/functions/auth/docs`
- **Admin API Docs**: `/.netlify/functions/admin/docs`
- **Person API Docs**: `/.netlify/functions/person/docs`

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature-Branch
3. Committe deine Änderungen
4. Push zum Branch
5. Erstelle einen Pull Request

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz.

## 🔗 Links

- **Live Demo**: https://radiant-maamoul-fab9c6.netlify.app/
- **GitHub**: https://github.com/jus-dan/swagger-api-netlify
- **Netlify**: https://app.netlify.com/projects/radiant-maamoul-fab9c6/overview
- **Supabase**: https://supabase.com/dashboard/project/kuwssdhydtjrkmvqajzc

## 🆘 Support

Bei Fragen oder Problemen:
1. Überprüfe die API-Dokumentation
2. Schaue in die Issues auf GitHub
3. Erstelle ein neues Issue mit detaillierter Beschreibung

---

**Entwickelt mit ❤️ für die Makerspace-Community**
