# 🏭 Makerspace Verwaltung

Eine vollständige Makerspace-Verwaltungsanwendung mit API-First-Ansatz, die das Anlegen, Bearbeiten und Löschen von Personen und Ressourcen (Maschinen, Räume, Werkzeuge) ermöglicht.

## ✨ Features

### 📊 Dashboard (Startseite)
- **Statistik-Übersicht**: Personen, Ressourcen, Kategorien und Rollen auf einen Blick
- **Letzte Einträge**: Die neuesten Personen, Ressourcen und Kategorien
- **Schnelle Aktionen**: Bearbeiten und Löschen direkt vom Dashboard
- **Status-Tracking**: Verfügbarkeit von Ressourcen in Echtzeit
- **Responsive Design**: Optimiert für Desktop und Mobile

### 👥 Personenverwaltung
- **Anlegen** neuer Personen mit Name, E-Mail und Rollen
- **Bearbeiten** bestehender Personen
- **Löschen** von Personen
- **Anzeigen** aller Personen mit Details
- **Rollen-Management**: Benutzer, Mitarbeiter, Coaches, Administratoren

### 🛠️ Ressourcenverwaltung
- **Kategorien**: Maschinen, Räume, Werkzeuge, Materialien, Computer
- **Status-Tracking**: Verfügbar, Wartung, Außer Betrieb
- **Spezifikationen**: Flexible JSON-Speicherung für technische Details
- **Standort-Management**: Tracking von Ressourcen-Standorten
- **Bild-Unterstützung**: URLs für Ressourcen-Bilder

### 📂 Kategorienverwaltung
- **Erstellen** neuer Kategorien mit Icons und Farben
- **Bearbeiten** bestehender Kategorien
- **Organisation** von Ressourcen nach Kategorien
- **Visuelle Darstellung** mit Farbkodierung

### 🎭 Rollenverwaltung
- **Definieren** von Benutzerrollen (User, Staff, Coach, Admin, etc.)
- **Berechtigungen** für verschiedene Funktionen
- **Flexible Rollenstruktur** für verschiedene Makerspace-Typen

### 📚 API-First Design
- **RESTful APIs** für alle CRUD-Operationen
- **Swagger/OpenAPI** Dokumentation
- **CORS-Unterstützung** für Cross-Origin Requests
- **Validierung** und Fehlerbehandlung

### 🎨 Modernes Frontend
- **React + Vite** für schnelle Entwicklung
- **Responsive Design** für Desktop und Mobile
- **Moderne UI** mit Modals, Cards und Animationen
- **Intuitive Navigation** zwischen Dashboard und allen Bereichen
- **Such- und Filterfunktionen** für alle Daten

## 🚀 Technologie-Stack

- **Frontend**: React 18, Vite, CSS3
- **Backend**: Node.js, Express, Netlify Functions
- **Datenbank**: Supabase (PostgreSQL)
- **API-Dokumentation**: Swagger/OpenAPI
- **Deployment**: Netlify
- **Styling**: Custom CSS mit modernen Design-Patterns

## 📋 Voraussetzungen

- Node.js 18+
- npm oder yarn
- Supabase-Account
- Netlify-Account (für Deployment)

## 🛠️ Installation

### 1. Repository klonen
```bash
git clone https://github.com/your-username/makerspace-management.git
cd makerspace-management
```

### 2. Dependencies installieren
```bash
npm install
cd frontend && npm install
```

### 3. Umgebungsvariablen konfigurieren
```bash
cp env.example .env
```

Füllen Sie die `.env` Datei mit Ihren Supabase-Credentials aus:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
```

### 4. Datenbank-Schema erstellen
Führen Sie das SQL-Schema in Ihrer Supabase-Datenbank aus:
```sql
-- Siehe database-schema.sql für das vollständige Schema
```

## 🏃‍♂️ Entwicklung

### Lokaler Server starten
```bash
# Im Hauptverzeichnis
npm run dev

# Oder im Frontend-Verzeichnis
cd frontend && npm run dev
```

### Netlify Functions lokal testen
```bash
netlify dev
```

Die Anwendung ist dann verfügbar unter:
- **Frontend**: http://localhost:8888
- **API-Dokumentation**: http://localhost:8888/swagger.html

## 📡 API-Endpunkte

### Personen
- `GET /api/person` - Alle Personen abrufen
- `GET /api/person/{id}` - Einzelne Person abrufen
- `POST /api/person` - Neue Person erstellen
- `PUT /api/person/{id}` - Person bearbeiten
- `DELETE /api/person/{id}` - Person löschen

### Ressourcen
- `GET /api/resource` - Alle Ressourcen abrufen
- `GET /api/resource/{id}` - Einzelne Ressource abrufen
- `POST /api/resource` - Neue Ressource erstellen
- `PUT /api/resource/{id}` - Ressource bearbeiten
- `DELETE /api/resource/{id}` - Ressource löschen

### Kategorien
- `GET /api/category` - Alle Kategorien abrufen
- `GET /api/category/{id}` - Einzelne Kategorie abrufen
- `POST /api/category` - Neue Kategorie erstellen
- `PUT /api/category/{id}` - Kategorie bearbeiten
- `DELETE /api/category/{id}` - Kategorie löschen

## 🚀 Deployment

### Netlify Deployment
1. Repository mit Netlify verbinden
2. Build-Einstellungen:
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
3. Umgebungsvariablen in Netlify setzen:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`

### Produktions-URLs
- **Frontend**: https://your-app.netlify.app
- **API-Dokumentation**: https://your-app.netlify.app/swagger.html

## 🗄️ Datenbank-Schema

### Tabellen
- **person**: Personen mit Rollen und Aktivitätsstatus
- **resource_category**: Kategorien für Ressourcen
- **resource**: Ressourcen (Maschinen, Räume, etc.)
- **booking**: Buchungen von Ressourcen (für zukünftige Features)
- **maintenance_log**: Wartungsprotokoll (für zukünftige Features)

### Standard-Kategorien
- 🏭 Maschinen (3D-Drucker, CNC, Laser-Cutter)
- 🏢 Räume (Workshops, Meeting-Räume)
- 🔧 Werkzeuge (Handwerkzeuge, Elektrowerkzeuge)
- 📦 Materialien (Holz, Metall, Kunststoff)
- 💻 Computer (Laptops, Desktop-PCs, Tablets)

### Standard-Rollen
- 👤 Benutzer (User)
- 👷 Mitarbeiter (Staff)
- 🎯 Coach
- 🔧 Wartung (Maintenance)
- 👨‍💼 Administrator (Admin)
- 🏢 CEO
- 💻 CTO
- 👨‍🏫 Instruktor (Instructor)

## 🎯 Verwendung

### Dashboard
1. **Startseite** zeigt Übersicht aller Daten
2. **Statistik-Karten** mit aktuellen Zahlen
3. **Letzte Einträge** für schnellen Überblick
4. **Schnelle Aktionen** direkt vom Dashboard

### Personen hinzufügen
1. Tab "Personen" wählen
2. "Neue Person" klicken
3. Name, E-Mail und Rollen eingeben
4. "Erstellen" klicken

### Ressourcen hinzufügen
1. Tab "Ressourcen" wählen
2. "Neue Ressource" klicken
3. Name, Kategorie und weitere Details eingeben
4. "Erstellen" klicken

### Kategorien verwalten
1. Tab "Kategorien" wählen
2. "Neue Kategorie" klicken
3. Name, Beschreibung, Icon und Farbe eingeben
4. "Erstellen" klicken

### Bearbeiten/Löschen
- Klicken Sie auf "Bearbeiten" oder "Löschen" bei den entsprechenden Einträgen
- Bestätigen Sie Löschvorgänge

## 🔧 Konfiguration

### Umgebungsvariablen
- `SUPABASE_URL`: Ihre Supabase-Projekt-URL
- `SUPABASE_KEY`: Ihr Supabase-Anon-Key
- `NODE_ENV`: Environment (development/production)

### Netlify-Konfiguration
Die `netlify.toml` Datei enthält:
- Build-Einstellungen
- Function-Konfiguration
- Redirect-Regeln für API-Endpunkte

## 🐛 Troubleshooting

### Häufige Probleme

**"Supabase nicht konfiguriert"**
- Überprüfen Sie Ihre `.env` Datei
- Stellen Sie sicher, dass die Umgebungsvariablen korrekt gesetzt sind

**"Port bereits in Verwendung"**
```bash
# Port 3999 freigeben
netstat -ano | findstr :3999
taskkill /PID <PID> /F
```

**API-Fehler**
- Überprüfen Sie die Netlify-Function-Logs
- Testen Sie die API-Endpunkte direkt über Swagger

**Dashboard lädt nicht**
- Überprüfen Sie die Browser-Konsole auf Fehler
- Stellen Sie sicher, dass alle API-Endpunkte funktionieren

## 🔮 Zukünftige Features

- 📅 **Buchungssystem** für Ressourcen
- 🔔 **Benachrichtigungen** für Wartungen
- 📈 **Erweiterte Statistiken** und Charts
- 👤 **Authentifizierung** und Rollen-Management
- 📱 **Mobile App** (React Native)
- 🔍 **Erweiterte Suche** und Filter
- 📊 **Export-Funktionen** (PDF, Excel)
- 🔄 **Automatische Backups**

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) Datei für Details.

## 🤝 Beitragen

1. Fork des Repositories
2. Feature-Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add some AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request erstellen

## 📞 Support

Bei Fragen oder Problemen:
- 📧 E-Mail: ...
- 🐛 Issues: GitHub Issues
- 📚 Dokumentation: Swagger UI unter `/swagger.html`

---

**Entwickelt mit ❤️ für die Makerspace-Community**
