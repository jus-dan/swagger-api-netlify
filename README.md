# Makerspace API mit Swagger

Ein Full-Stack-Projekt mit React-Frontend und Node.js/Express API, bereitgestellt auf Netlify mit Supabase als Datenbank.

## 🚀 Features

- **Backend**: Express.js API mit Netlify Functions
- **Frontend**: React-Anwendung mit Vite
- **Datenbank**: Supabase (PostgreSQL)
- **Dokumentation**: Swagger/OpenAPI
- **Deployment**: Netlify

## 📋 Voraussetzungen

- Node.js (Version 18 oder höher)
- npm oder yarn
- Supabase-Konto

## 🛠️ Installation

### 1. Repository klonen
```bash
git clone <repository-url>
cd swagger-api-netlify
```

### 2. Dependencies installieren
```bash
# Root-Dependencies
npm install

# Frontend-Dependencies
cd frontend
npm install
cd ..
```

### 3. Umgebungsvariablen konfigurieren

Erstellen Sie eine `.env` Datei im Root-Verzeichnis:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# Optional: Environment
NODE_ENV=development
```

### 4. Supabase-Datenbank einrichten

Erstellen Sie eine Tabelle `person` in Ihrer Supabase-Datenbank:

```sql
CREATE TABLE person (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  roles TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🏃‍♂️ Entwicklung

### Lokale Entwicklung
```bash
# Frontend starten
cd frontend
npm run dev

# API-Funktionen lokal testen (optional)
netlify dev
```

### Build
```bash
# Frontend builden
cd frontend
npm run build
```

## 📚 API-Endpunkte

### Hello API
- `GET /api/hello` - Einfache Begrüßung
- `GET /api/api-docs` - Swagger-Dokumentation

### Person API
- `GET /api/person` - Alle Personen abrufen
- `GET /api/person/:id` - Einzelne Person abrufen
- `POST /api/person` - Neue Person erstellen
- `GET /api/person/docs` - Swagger-Dokumentation

### Beispiel POST Request
```json
{
  "name": "Max Mustermann",
  "email": "max@example.com",
  "roles": ["admin", "user"]
}
```

## 🌐 Deployment

Das Projekt ist für Netlify konfiguriert:

1. Verbinden Sie Ihr Repository mit Netlify
2. Setzen Sie die Umgebungsvariablen in Netlify
3. Deploy wird automatisch bei Push ausgelöst

## 🔧 Konfiguration

### Netlify-Konfiguration (`netlify.toml`)
- Functions-Verzeichnis: `functions`
- Build-Befehl: Installiert Dependencies und baut Frontend
- Publish-Verzeichnis: `frontend/dist`

### Umgebungsvariablen
- `SUPABASE_URL`: Ihre Supabase-Projekt-URL
- `SUPABASE_KEY`: Ihr Supabase-Anon-Key
- `URL`: Automatisch von Netlify gesetzt

## 🐛 Troubleshooting

### Häufige Probleme

1. **Supabase-Verbindung fehlschlägt**
   - Überprüfen Sie die Umgebungsvariablen
   - Stellen Sie sicher, dass die Tabelle existiert

2. **CORS-Fehler**
   - CORS ist bereits konfiguriert
   - Überprüfen Sie die API-URLs

3. **Build-Fehler**
   - Stellen Sie sicher, dass alle Dependencies installiert sind
   - Überprüfen Sie die Node.js-Version

## 📝 Lizenz

ISC License
