import React, { useState, useEffect } from 'react';
import './App.css';

// Organization Registration Component
const OrganizationRegister = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationSlug: '',
    adminEmail: '',
    adminName: '',
    adminPassword: '',
    adminPasswordConfirm: ''
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

    // Auto-generate slug when organization name changes
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
        !formData.adminEmail || !formData.adminName || 
        !formData.adminPassword || !formData.adminPasswordConfirm) {
      setError('Alle Pflichtfelder sind erforderlich');
      return false;
    }

    if (formData.adminPassword !== formData.adminPasswordConfirm) {
      setError('Passwörter stimmen nicht überein');
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
      const apiUrl = import.meta.env.DEV 
        ? 'http://localhost:8888/.netlify/functions/organization/register'
        : '/.netlify/functions/organization/register';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organizationName: formData.organizationName,
          organizationSlug: formData.organizationSlug,
          adminEmail: formData.adminEmail,
          adminName: formData.adminName,
          adminPassword: formData.adminPassword
        })
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
          <h3>🎉 Workspace erfolgreich registriert!</h3>
          <p>{success.message}</p>
          
          <div className="workspace-info">
            <h4>Dein Workspace:</h4>
            <p><strong>Name:</strong> {success.organization?.name}</p>
            <p><strong>Slug:</strong> {success.organization?.slug}</p>
            <p><strong>Admin:</strong> {success.organization?.adminEmail}</p>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button 
              className="submit-button" 
              onClick={() => onBack()}
            >
              Zum Login
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
        <h1>⏰ BenchTime-Workspace registrieren</h1>
        <p>Erstelle deinen eigenen Workspace mit Admin-Konto</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="organizationName">Workspace-Name *</label>
          <input
            type="text"
            id="organizationName"
            name="organizationName"
            value={formData.organizationName}
            onChange={handleInputChange}
            placeholder="Mein BenchTime-Workspace"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="organizationSlug">Workspace-Slug *</label>
          <input
            type="text"
            id="organizationSlug"
            name="organizationSlug"
            value={formData.organizationSlug}
            onChange={handleInputChange}
            placeholder="mein-workspace"
            required
            readOnly
          />
          <small>Wird automatisch aus dem Namen generiert</small>
        </div>

        <div className="form-group">
          <label htmlFor="adminEmail">Admin E-Mail *</label>
          <input
            type="email"
            id="adminEmail"
            name="adminEmail"
            value={formData.adminEmail}
            onChange={handleInputChange}
            placeholder="admin@workspace.de"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="adminName">Admin Name *</label>
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
          <label htmlFor="adminPassword">Admin Passwort *</label>
          <input
            type="password"
            id="adminPassword"
            name="adminPassword"
            value={formData.adminPassword}
            onChange={handleInputChange}
            placeholder="Mindestens 6 Zeichen"
            required
            minLength="6"
          />
        </div>

        <div className="form-group">
          <label htmlFor="adminPasswordConfirm">Passwort bestätigen *</label>
          <input
            type="password"
            id="adminPasswordConfirm"
            name="adminPasswordConfirm"
            value={formData.adminPasswordConfirm}
            onChange={handleInputChange}
            placeholder="Passwort wiederholen"
            required
            minLength="6"
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registriere...' : 'Workspace registrieren'}
          </button>
        </div>
      </form>

      <div className="register-info">
        <h3>ℹ️ Nach der Registrierung</h3>
        <ul>
          <li>Dein Workspace wird erstellt</li>
          <li>Du bekommst ein Admin-Konto</li>
          <li>Du kannst weitere Benutzer hinzufügen</li>
          <li>Alle Daten sind isoliert in deinem Workspace</li>
        </ul>
      </div>
    </div>
  );
};

// Forgot Password Component
const ForgotPassword = ({ onBack, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('E-Mail-Adresse ist erforderlich');
      return;
    }

    setIsSubmitting(true);

    try {
      const apiUrl = import.meta.env.DEV 
        ? 'http://localhost:8888/.netlify/functions/auth/forgot-password'
        : '/.netlify/functions/auth/forgot-password';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data);
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        setError(data.error || 'Fehler beim Anfordern des Passwort-Resets');
      }
    } catch (err) {
      setError('Netzwerkfehler: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="forgot-password">
        <div className="success-message">
          <h3>📧 E-Mail gesendet!</h3>
          <p>{success.message}</p>
          
          {/* Debug-Info anzeigen */}
          <div className="debug-info" style={{ marginTop: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '6px', fontSize: '0.8rem' }}>
            <strong>Debug-Info:</strong>
            <pre>{JSON.stringify(success, null, 2)}</pre>
            <strong>Success State Keys:</strong>
            <pre>{Object.keys(success || {}).join(', ')}</pre>
          </div>
          
          {/* Hauptanzeige basierend auf dem Modus */}
          {success && success.mode === 'development' ? (
            <div className="dev-mode">
              <h4>🔧 Entwicklungsmodus aktiviert</h4>
              <p>{success.note || 'SendGrid ist nicht konfiguriert. Verwende den Link zum Testen.'}</p>
              {success.resetUrl && (
                <div className="reset-link-box">
                  <h5>🔗 Reset-Link zum Testen:</h5>
                  <div className="link-container">
                    <a href={success.resetUrl} target="_blank" rel="noopener noreferrer" className="reset-link">
                      {success.resetUrl}
                    </a>
                    <button 
                      onClick={() => navigator.clipboard.writeText(success.resetUrl)}
                      className="copy-button"
                      title="Link kopieren"
                    >
                      📋
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : success && success.emailSent ? (
            <div className="email-success">
              <h4>✅ E-Mail erfolgreich versendet!</h4>
              <p>Bitte überprüfe dein E-Mail-Postfach und klicke auf den Reset-Link.</p>
              {success.messageId && (
                <p><small>E-Mail-ID: {success.messageId}</small></p>
              )}
              <p><small>Modus: {success.mode}</small></p>
            </div>
          ) : (
            <div className="email-fallback">
              <h4>⚠️ E-Mail konnte nicht gesendet werden</h4>
              {success.emailError && <p>Fehler: {success.emailError}</p>}
              {success.resetUrl && (
                <div className="dev-info">
                  <h4>🔧 Fallback - Reset-Link:</h4>
                  <p><a href={success.resetUrl} target="_blank" rel="noopener noreferrer">{success.resetUrl}</a></p>
                </div>
              )}
            </div>
          )}
          
          <div style={{ marginTop: '20px' }}>
            <button className="submit-button" onClick={() => onBack()}>Zurück zum Login</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password">
      <div className="forgot-header">
        <button className="back-button" onClick={onBack}>
          ← Zurück
        </button>
        <h1>🔑 Passwort vergessen</h1>
        <p>Gib deine E-Mail-Adresse ein, um dein Passwort zurückzusetzen</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">E-Mail-Adresse</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="deine@email.de"
            required
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sende...' : 'Passwort zurücksetzen'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Reset Password Component
const ResetPassword = ({ token, onSuccess, onError }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!password || !confirmPassword) {
      setError('Alle Felder sind erforderlich');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setIsSubmitting(true);

    try {
      const apiUrl = import.meta.env.DEV 
        ? 'http://localhost:8888/.netlify/functions/auth/reset-password'
        : '/.netlify/functions/auth/reset-password';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          token: token,
          password: password 
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data);
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        setError(data.error || 'Fehler beim Zurücksetzen des Passworts');
      }
    } catch (err) {
      setError('Netzwerkfehler: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="reset-password">
        <div className="success-message">
          <h3>✅ Passwort erfolgreich zurückgesetzt!</h3>
          <p>{success.message}</p>
          <div style={{ marginTop: '20px' }}>
            <button className="submit-button" onClick={() => window.location.href = '/'}>
              Zum Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password">
      <div className="reset-header">
        <h1>🔑 Neues Passwort setzen</h1>
        <p>Gib dein neues Passwort ein</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="password">Neues Passwort</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mindestens 6 Zeichen"
            required
            minLength="6"
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Passwort bestätigen</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Passwort wiederholen"
            required
            minLength="6"
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Setze zurück...' : 'Passwort zurücksetzen'}
          </button>
        </div>
      </form>
    </div>
  );
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showOrganizationRegister, setShowOrganizationRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetToken, setResetToken] = useState(null);

  // Check for reset password token in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    if (resetToken && window.location.pathname === '/reset-password') {
      setShowResetPassword(true);
      setResetToken(resetToken);
    }
  }, []);

  // Check if user is logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user info
      fetch('/.netlify/functions/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Token invalid');
      })
      .then(data => {
        setUser(data.user);
        setIsLoggedIn(true);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setUser(null);
      });
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');

    try {
      const response = await fetch('/.netlify/functions/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        setIsLoggedIn(true);
      } else {
        alert(data.error || 'Login fehlgeschlagen');
      }
    } catch (error) {
      alert('Netzwerkfehler beim Login');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
  };

  // Show organization registration
  if (showOrganizationRegister) {
    return (
      <div className="app">
        <OrganizationRegister 
          onBack={() => setShowOrganizationRegister(false)}
          onSuccess={(data) => {
            setShowOrganizationRegister(false);
            // Optional: Zeige Erfolgsmeldung
          }}
        />
      </div>
    );
  }

  // Show forgot password
  if (showForgotPassword) {
    return (
      <div className="app">
        <ForgotPassword 
          onBack={() => setShowForgotPassword(false)}
          onSuccess={(data) => {
            console.log('Passwort-Reset angefordert:', data);
          }}
        />
      </div>
    );
  }

  // Show reset password
  if (showResetPassword) {
    return (
      <div className="app">
        <ResetPassword 
          token={resetToken}
          onSuccess={(data) => {
            console.log('Passwort erfolgreich zurückgesetzt:', data);
            setShowResetPassword(false);
          }}
          onError={(error) => {
            console.error('Fehler beim Zurücksetzen des Passworts:', error);
            setShowResetPassword(false);
          }}
        />
      </div>
    );
  }

  // Show main app if logged in
  if (isLoggedIn && user) {
    return (
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <h1>⏰ BenchTime</h1>
            <div className="user-info">
              <span>Willkommen, {user.person?.name || user.username}!</span>
              <button onClick={handleLogout} className="logout-button">
                Abmelden
              </button>
            </div>
          </div>
        </header>

        <main className="app-main">
          <div className="dashboard">
            <h2>Dashboard</h2>
            <p>Willkommen in deinem BenchTime-Workspace!</p>
            
            {/* Hier können weitere Komponenten hinzugefügt werden */}
            <div className="quick-actions">
              <h3>Schnellaktionen</h3>
              <div className="action-buttons">
                <button className="action-button">
                  👥 Personen verwalten
                </button>
                <button className="action-button">
                  🛠️ Ressourcen verwalten
                </button>
                <button className="action-button">
                  📂 Kategorien verwalten
                </button>
              </div>
            </div>
          </div>
        </main>

        <footer className="app-footer">
          <div className="version-info">
            <span>v1.0.0 | Build 2025-01-22 | dev</span>
            <span>Build: 2025-01-22</span>
            <span>BenchTime © 2024</span>
          </div>
        </footer>
      </div>
    );
  }

  // Show login screen
  return (
    <div className="app">
      <div className="login-container">
        <div className="login-header">
          <h1>⏰ BenchTime</h1>
          <p>Werkstatt-Management System</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Benutzername</label>
            <input
              type="text"
              id="username"
              name="username"
              required
              placeholder="Dein Benutzername"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Passwort</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              placeholder="Dein Passwort"
            />
          </div>

          <button type="submit" className="submit-button">
            Anmelden
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            onClick={() => setShowForgotPassword(true)}
            className="link-button"
            style={{ 
              background: 'none',
              border: 'none',
              color: '#3498db',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '0.9em',
              marginBottom: '15px'
            }}
          >
            Passwort vergessen?
          </button>
          
          <button 
            onClick={() => setShowOrganizationRegister(true)}
            className="btn-secondary"
            style={{ 
              background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
              border: 'none',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1em',
              fontWeight: '600'
            }}
          >
            ⏰ Neuen BenchTime-Workspace registrieren
          </button>
          
          <p style={{ color: '#7f8c8d', marginBottom: '15px' }}>
            Registriere deinen eigenen BenchTime-Workspace mit Admin-Konto
          </p>
        </div>

        {/* Footer auch im Login-Bereich anzeigen */}
        <footer className="app-footer">
          <div className="version-info">
            <span>v1.0.0 | Build 2025-01-22 | dev</span>
            <span>Build: 2025-01-22</span>
            <span>BenchTime © 2024</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
