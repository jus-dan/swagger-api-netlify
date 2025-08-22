import React, { useState } from 'react';

const OrganizationRegister = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationSlug: '',
    adminUsername: '',
    adminPassword: '',
    adminEmail: '',
    adminName: '',
    description: '',
    website: '',
    address: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate slug from organization name
    if (name === 'organizationName') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({
        ...prev,
        organizationSlug: slug
      }));
    }
  };

  const validateForm = () => {
    if (!formData.organizationName || !formData.organizationSlug || 
        !formData.adminUsername || !formData.adminPassword || 
        !formData.adminEmail || !formData.adminName) {
      setError('Alle Pflichtfelder sind erforderlich');
      return false;
    }

    if (formData.adminPassword.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.adminEmail)) {
      setError('Ungültige E-Mail-Adresse');
      return false;
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(formData.organizationSlug)) {
      setError('Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:8888/.netlify/functions/organization/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data);
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        setError(data.error || 'Fehler bei der Registrierung');
      }
    } catch (err) {
      setError('Netzwerkfehler: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="organization-register">
        <div className="success-message">
          <h3>🎉 BenchTime-Workspace erfolgreich registriert!</h3>
          <p>Willkommen bei der BenchTime-Werkstatt-Verwaltungsplattform!</p>
          
          <div className="next-steps">
            <h4>Nächste Schritte:</h4>
            <ul>
              {success.nextSteps?.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button 
              className="submit-button" 
              onClick={() => onBack()}
              style={{ marginRight: '10px' }}
            >
              Zurück zum Login
            </button>
            <button 
              className="submit-button" 
              onClick={() => window.location.reload()}
              style={{ background: 'linear-gradient(135deg, #27ae60, #2ecc71)' }}
            >
              Neuen BenchTime-Workspace registrieren
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="organization-register">
      <div className="register-header">
        <button className="back-button" onClick={onBack}>
          ← Zurück
        </button>
        <h1>⏰ Neuen BenchTime-Workspace registrieren</h1>
        <p>Erstelle deine eigene Werkstatt-Instanz und verwalte deine Ressourcen</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Organization Information */}
        <div className="form-section">
          <h3>🏢 Organisations-Informationen</h3>
          
          <div className="form-group">
            <label htmlFor="organizationName">Name des Makerspaces *</label>
            <input
              type="text"
              id="organizationName"
              name="organizationName"
              value={formData.organizationName}
              onChange={handleInputChange}
              placeholder="z.B. FabLab München, MakerSpace Berlin"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="organizationSlug">URL-Slug *</label>
            <input
              type="text"
              id="organizationSlug"
              name="organizationSlug"
              value={formData.organizationSlug}
              onChange={handleInputChange}
              placeholder="z.B. fablab-muenchen, makerspace-berlin"
              required
            />
            <small>Wird für URLs verwendet. Nur Kleinbuchstaben, Zahlen und Bindestriche erlaubt.</small>
          </div>

          <div className="form-group">
            <label htmlFor="description">Beschreibung</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Beschreibe deinen Makerspace, seine Ausstattung und Ziele..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="website">Website</label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="https://www.dein-makerspace.de"
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Adresse</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Straße, Hausnummer, PLZ, Stadt"
            />
          </div>
        </div>

        {/* Admin Account */}
        <div className="form-section">
          <h3>👤 Admin-Konto erstellen</h3>
          
          <div className="form-group">
            <label htmlFor="adminName">Vollständiger Name *</label>
            <input
              type="text"
              id="adminName"
              name="adminName"
              value={formData.adminName}
              onChange={handleInputChange}
              placeholder="Vor- und Nachname"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="adminEmail">E-Mail-Adresse *</label>
            <input
              type="email"
              id="adminEmail"
              name="adminEmail"
              value={formData.adminEmail}
              onChange={handleInputChange}
              placeholder="admin@dein-makerspace.de"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="adminUsername">Benutzername *</label>
            <input
              type="text"
              id="adminUsername"
              name="adminUsername"
              value={formData.adminUsername}
              onChange={handleInputChange}
              placeholder="admin, verwalter, etc."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="adminPassword">Passwort *</label>
            <input
              type="password"
              id="adminPassword"
              name="adminPassword"
              value={formData.adminPassword}
              onChange={handleInputChange}
              placeholder="Mindestens 6 Zeichen"
              required
            />
            <small>Das Passwort wird sicher gehashed und gespeichert.</small>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registriere...' : 'Makerspace registrieren'}
          </button>
        </div>
      </form>

      {/* Information Box */}
      <div className="register-info">
        <h3>ℹ️ Was bekommst du?</h3>
        <ul>
          <li>Eigene Makerspace-Instanz mit isolierten Daten</li>
          <li>Admin-Panel für Benutzer- und Rollenverwaltung</li>
          <li>Ressourcenverwaltung (Werkzeuge, Maschinen, Material)</li>
          <li>Benutzer-Einladungssystem</li>
          <li>Rollenbasierte Berechtigungen</li>
          <li>API für Integrationen</li>
        </ul>

        <div className="pricing-info">
          <h4>💰 Kostenlose Nutzung</h4>
          <p>Starte kostenlos mit bis zu 10 Benutzern. Später können Premium-Features hinzugebucht werden.</p>
          <ul>
            <li>Unbegrenzte Ressourcen</li>
            <li>Standard-Support</li>
            <li>Regelmäßige Updates</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OrganizationRegister;
