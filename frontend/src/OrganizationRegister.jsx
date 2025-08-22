import React, { useState } from 'react';

const OrganizationRegister = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationSlug: '',
    adminEmail: '',
    adminName: ''
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

  // Auto-generate slug when component mounts or organizationName changes
  React.useEffect(() => {
    if (formData.organizationName && !formData.organizationSlug) {
      const slug = formData.organizationName
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
  }, [formData.organizationName]);

  const validateForm = () => {
    // Überprüfe alle Pflichtfelder einzeln
    if (!formData.organizationName) {
      setError('Bitte gib den Namen des Makerspaces ein');
      return false;
    }
    
    if (!formData.organizationSlug) {
      setError('Der URL-Slug wird automatisch generiert. Bitte gib zuerst den Namen ein.');
      return false;
    }
    
    if (!formData.adminName) {
      setError('Bitte gib den Namen des Admins ein');
      return false;
    }
    
    if (!formData.adminEmail) {
      setError('Bitte gib die E-Mail-Adresse des Admins ein');
      return false;
    }

    // E-Mail-Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.adminEmail)) {
      setError('Bitte gib eine gültige E-Mail-Adresse ein');
      return false;
    }

    // Slug-Validierung
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(formData.organizationSlug)) {
      setError('Der generierte Slug enthält ungültige Zeichen. Bitte überprüfe den Namen.');
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
      // Dynamische URL für lokale Entwicklung und Produktion
      const apiUrl = import.meta.env.DEV 
        ? 'http://localhost:8888/.netlify/functions/organization/register'
        : '/.netlify/functions/organization/register';

      const response = await fetch(apiUrl, {
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
              placeholder="Wird automatisch generiert"
              required
              readOnly
            />
            <small>Wird automatisch aus dem Namen generiert. Nur Kleinbuchstaben, Zahlen und Bindestriche erlaubt.</small>
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
