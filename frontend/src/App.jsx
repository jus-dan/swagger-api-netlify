import { useEffect, useState } from 'react'
import './App.css'
import OrganizationRegister from './OrganizationRegister'

// Passwort vergessen Komponente
const ForgotPassword = ({ onBack, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
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
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      console.log('📥 Backend-Antwort erhalten:', data);
      console.log('📊 Response Status:', response.status);
      console.log('📋 Response Headers:', response.headers);

      if (response.ok) {
        console.log('✅ Erfolgreiche Antwort, setze Success State');
        setSuccess(data);
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        console.log('❌ Fehler-Antwort:', data);
        setError(data.error || 'Fehler bei der Anfrage');
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
          ) : success && success.resetUrl ? (
            <div className="fallback-mode">
              <h4>🔧 Fallback-Modus</h4>
              <p>Reset-Link verfügbar (Modus nicht gesetzt)</p>
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
            </div>
          ) : success.emailSent ? (
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
            <button 
              className="submit-button" 
              onClick={() => onBack()}
            >
              Zurück zum Login
            </button>
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
        <h1>🔐 Passwort vergessen</h1>
        <p>Gib deine E-Mail-Adresse ein, um dein Passwort zurückzusetzen</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">E-Mail-Adresse *</label>
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

      <div className="forgot-info">
        <h3>ℹ️ Wie funktioniert das?</h3>
        <ol>
          <li>Gib deine E-Mail-Adresse ein</li>
          <li>Du erhältst einen Reset-Link per E-Mail</li>
          <li>Klicke auf den Link und setze ein neues Passwort</li>
          <li>Melde dich mit dem neuen Passwort an</li>
        </ol>
        <p><strong>Hinweis:</strong> Der Link ist 24 Stunden gültig.</p>
      </div>
    </div>
  );
};

// Reset Password Komponente
const ResetPassword = ({ token, onSuccess, onError }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    if (newPassword.length < 6) {
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
          newPassword: newPassword 
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
          <h3>🎉 Passwort erfolgreich zurückgesetzt!</h3>
          <p>{success.message}</p>
          
          <div style={{ marginTop: '20px' }}>
            <button 
              className="submit-button" 
              onClick={() => window.location.href = '/'}
            >
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
        <h1>🔐 Passwort zurücksetzen</h1>
        <p>Gib dein neues Passwort ein</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="newPassword">Neues Passwort *</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mindestens 6 Zeichen"
            required
            minLength="6"
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Passwort bestätigen *</label>
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

      <div className="reset-info">
        <h3>ℹ️ Sicherheitshinweise</h3>
        <ul>
          <li>Verwende ein sicheres Passwort (mindestens 6 Zeichen)</li>
          <li>Das Passwort wird verschlüsselt gespeichert</li>
          <li>Du kannst dich sofort mit dem neuen Passwort anmelden</li>
        </ul>
      </div>
    </div>
  );
};

// Benutzer-Registrierung Komponente
const UserRegister = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    name: '',
    password: '',
    confirmPassword: ''
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
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.name || !formData.password) {
      setError('Alle Felder sind erforderlich');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
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
        ? 'http://localhost:8888/.netlify/functions/auth/register'
        : '/.netlify/functions/auth/register';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          name: formData.name,
          password: formData.password
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
      <div className="user-register">
        <div className="success-message">
          <h3>🎉 Registrierung erfolgreich!</h3>
          <p>{success.message}</p>
          
          <div className="user-info">
            <h4>Dein Konto:</h4>
            <p><strong>Benutzername:</strong> {success.user?.username}</p>
            <p><strong>E-Mail:</strong> {success.user?.email}</p>
            <p><strong>Name:</strong> {success.user?.person?.name}</p>
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
    <div className="user-register">
      <div className="register-header">
        <button className="back-button" onClick={onBack}>
          ← Zurück
        </button>
        <h1>👤 Benutzer registrieren</h1>
        <p>Erstelle dein persönliches Konto</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Benutzername *</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            placeholder="Dein Benutzername"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">E-Mail-Adresse *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="deine@email.de"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="name">Vollständiger Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Vor- und Nachname"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Passwort *</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Mindestens 6 Zeichen"
            required
            minLength="6"
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Passwort bestätigen *</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
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
            {isSubmitting ? 'Registriere...' : 'Registrieren'}
          </button>
        </div>
      </form>

      <div className="register-info">
        <h3>ℹ️ Nach der Registrierung</h3>
        <ul>
          <li>Du kannst dich sofort mit deinen Daten anmelden</li>
          <li>Dein Konto hat die Standard-Rolle "Benutzer"</li>
          <li>Du kannst später weitere Rollen erhalten</li>
        </ul>
      </div>
    </div>
  );
};

function App() {
  // Build-Informationen (wird bei jedem Build aktualisiert)
  const getBuildInfoString = () => {
    return `v1.0.0 | Build ${new Date().toISOString().split('T')[0]} | dev`;
  };

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [persons, setPersons] = useState([])
  const [resources, setResources] = useState([])
  const [categories, setCategories] = useState([])
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState({})
  const [error, setError] = useState(null)
  const [showOrganizationRegister, setShowOrganizationRegister] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [showUserRegister, setShowUserRegister] = useState(false)
  const [resetToken, setResetToken] = useState(null)

  // Form states
  const [showPersonForm, setShowPersonForm] = useState(false)
  const [showResourceForm, setShowResourceForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingPerson, setEditingPerson] = useState(null)
  const [editingResource, setEditingResource] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [personForm, setPersonForm] = useState({ name: '', email: '', roles: ['user'] })
  const [resourceForm, setResourceForm] = useState({ name: '', description: '', category_id: '', status: 'available', location: '' })
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: '', color: '#007bff' })

  const apiBase = import.meta.env.DEV
    ? 'http://localhost:8888/.netlify/functions'
    : '/.netlify/functions'

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    // Prüfe ob wir auf der Reset-Password-Seite sind
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    
    if (resetToken && window.location.pathname === '/reset-password') {
      setShowResetPassword(true);
      setResetToken(resetToken);
    }
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('authToken')
    if (token) {
      try {
        const response = await fetch(`${apiBase}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          const userData = await response.json()
          setUser(userData.user)
          loadUserPermissions(userData.user)
          loadData()
        } else {
          localStorage.removeItem('authToken')
        }
      } catch (err) {
        localStorage.removeItem('authToken')
      }
    }
    setLoading(false)
  }

  const loadUserPermissions = async (userData) => {
    try {
      const userRoles = userData.roles || []
      const permissions = {}
      
      for (const role of userRoles) {
        const response = await fetch(`${apiBase}/auth/permissions?roleId=${role.id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        })
        if (response.ok) {
          const rolePermissions = await response.json()
          for (const perm of rolePermissions) {
            if (!permissions[perm.resource_type]) {
              permissions[perm.resource_type] = {}
            }
            permissions[perm.resource_type] = {
              ...permissions[perm.resource_type],
              ...perm
            }
          }
        }
      }
      setPermissions(permissions)
    } catch (err) {
      console.error('Fehler beim Laden der Berechtigungen:', err)
    }
  }

  const loadData = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const headers = { 'Authorization': `Bearer ${token}` }

      const [personsRes, resourcesRes, categoriesRes] = await Promise.all([
        fetch(`${apiBase}/person`, { headers }),
        fetch(`${apiBase}/resource`, { headers }),
        fetch(`${apiBase}/category`, { headers })
      ])

      if (personsRes.ok) {
        const personsData = await personsRes.json()
        setPersons(personsData)
      }
      if (resourcesRes.ok) {
        const resourcesData = await resourcesRes.json()
        setResources(resourcesData)
      }
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData)
      }
    } catch (err) {
      console.error('Fehler beim Laden der Daten:', err)
      setError(err.message)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const username = formData.get('username')
    const password = formData.get('password')

    try {
      const response = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('authToken', data.token)
        setUser(data.user)
        loadUserPermissions(data.user)
        loadData()
      } else {
        const errorData = await response.json()
        alert('Login fehlgeschlagen: ' + errorData.error)
      }
    } catch (err) {
      alert('Fehler beim Login: ' + err.message)
    }
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('authToken')
      await fetch(`${apiBase}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
    } catch (err) {
      console.error('Fehler beim Logout:', err)
    } finally {
      localStorage.removeItem('authToken')
      setUser(null)
      setPermissions({})
      setPersons([])
      setResources([])
      setCategories([])
    }
  }

  const hasPermission = (resourceType, permission) => {
    return permissions[resourceType]?.[permission] === true
  }

  const isAdmin = () => {
    return user?.roles?.some(role => role.name === 'admin') || false
  }

  // CRUD operations with permission checks
  const handlePersonSubmit = async (e) => {
    e.preventDefault()
    if (!hasPermission('person', 'can_create') && !hasPermission('person', 'can_edit')) {
      alert('Keine Berechtigung für diese Aktion')
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const url = editingPerson 
        ? `${apiBase}/person/${editingPerson.id}`
        : `${apiBase}/person`
      
      const method = editingPerson ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(personForm)
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      setShowPersonForm(false)
      setEditingPerson(null)
      setPersonForm({ name: '', email: '', roles: ['user'] })
      loadData()
    } catch (err) {
      console.error('Fehler beim Speichern der Person:', err)
      alert('Fehler beim Speichern: ' + err.message)
    }
  }

  const handlePersonEdit = (person) => {
    if (!hasPermission('person', 'can_edit')) {
      alert('Keine Berechtigung zum Bearbeiten von Personen')
      return
    }
    setEditingPerson(person)
    setPersonForm({
      name: person.name,
      email: person.email,
      roles: person.roles
    })
    setShowPersonForm(true)
  }

  const handlePersonDelete = async (id) => {
    if (!hasPermission('person', 'can_delete')) {
      alert('Keine Berechtigung zum Löschen von Personen')
      return
    }
    
    if (!confirm('Möchten Sie diese Person wirklich löschen?')) return
    
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${apiBase}/person/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      loadData()
    } catch (err) {
      console.error('Fehler beim Löschen der Person:', err)
      alert('Fehler beim Löschen: ' + err.message)
    }
  }

  // Resource CRUD operations
  const handleResourceSubmit = async (e) => {
    e.preventDefault()
    if (!hasPermission('resource', 'can_create') && !hasPermission('resource', 'can_edit')) {
      alert('Keine Berechtigung für diese Aktion')
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const url = editingResource 
        ? `${apiBase}/resource/${editingResource.id}`
        : `${apiBase}/resource`
      
      const method = editingResource ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(resourceForm)
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      setShowResourceForm(false)
      setEditingResource(null)
      setResourceForm({ name: '', description: '', category_id: '', status: 'available', location: '' })
      loadData()
    } catch (err) {
      console.error('Fehler beim Speichern der Ressource:', err)
      alert('Fehler beim Speichern: ' + err.message)
    }
  }

  const handleResourceEdit = (resource) => {
    if (!hasPermission('resource', 'can_edit')) {
      alert('Keine Berechtigung zum Bearbeiten von Ressourcen')
      return
    }
    setEditingResource(resource)
    setResourceForm({
      name: resource.name,
      description: resource.description || '',
      category_id: resource.category_id || '',
      status: resource.status,
      location: resource.location || ''
    })
    setShowResourceForm(true)
  }

  const handleResourceDelete = async (id) => {
    if (!hasPermission('resource', 'can_delete')) {
      alert('Keine Berechtigung zum Löschen von Ressourcen')
      return
    }
    
    if (!confirm('Möchten Sie diese Ressource wirklich löschen?')) return
    
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${apiBase}/resource/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      loadData()
    } catch (err) {
      console.error('Fehler beim Löschen der Ressource:', err)
      alert('Fehler beim Löschen: ' + err.message)
    }
  }

  // Category CRUD operations
  const handleCategorySubmit = async (e) => {
    e.preventDefault()
    if (!hasPermission('category', 'can_create') && !hasPermission('category', 'can_edit')) {
      alert('Keine Berechtigung für diese Aktion')
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const url = editingCategory 
        ? `${apiBase}/category/${editingCategory.id}`
        : `${apiBase}/category`
      
      const method = editingCategory ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(categoryForm)
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      setShowCategoryForm(false)
      setEditingCategory(null)
      setCategoryForm({ name: '', description: '', icon: '', color: '#007bff' })
      loadData()
    } catch (err) {
      console.error('Fehler beim Speichern der Kategorie:', err)
      alert('Fehler beim Speichern: ' + err.message)
    }
  }

  const handleCategoryEdit = (category) => {
    if (!hasPermission('category', 'can_edit')) {
      alert('Keine Berechtigung zum Bearbeiten von Kategorien')
      return
    }
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      color: category.color || '#007bff'
    })
    setShowCategoryForm(true)
  }

  const handleCategoryDelete = async (id) => {
    if (!hasPermission('category', 'can_delete')) {
      alert('Keine Berechtigung zum Löschen von Kategorien')
      return
    }
    
    if (!confirm('Möchten Sie diese Kategorie wirklich löschen?')) return
    
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${apiBase}/category/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      loadData()
    } catch (err) {
      console.error('Fehler beim Löschen der Kategorie:', err)
      alert('Fehler beim Löschen: ' + err.message)
    }
  }

  // Role CRUD operations (for now, just local state management)
  const handleRoleSubmit = async (e) => {
    e.preventDefault()
    // This section is now handled by the admin API, so no direct CRUD here
    // For now, we'll just update local state if needed, but the admin API is primary
    if (editingRole) {
      // This part needs to be updated to call an admin API for role updates
      // For now, it's a placeholder
      console.warn('Rolle bearbeiten: Funktion noch nicht vollständig implementiert')
      // Example: setRoles(roles.map(role => 
      //   role.value === editingRole.value ? roleForm : role
      // ))
    } else {
      // This part needs to be updated to call an admin API for role creation
      // For now, it's a placeholder
      console.warn('Rolle hinzufügen: Funktion noch nicht vollständig implementiert')
      // setRoles([...roles, roleForm])
    }

    setShowRoleForm(false)
    setEditingRole(null)
    setRoleForm({ value: '', label: '', description: '' })
  }

  const handleRoleEdit = (role) => {
    // This section is now handled by the admin API, so no direct CRUD here
    // For now, it's a placeholder
    console.warn('Rolle bearbeiten: Funktion noch nicht vollständig implementiert')
    // setEditingRole(role)
    // setRoleForm({
    //   value: role.value,
    //   label: role.label,
    //   description: role.description || ''
    // })
    // setShowRoleForm(true)
  }

  const handleRoleDelete = async (value) => {
    // This section is now handled by the admin API, so no direct CRUD here
    // For now, it's a placeholder
    console.warn('Rolle löschen: Funktion noch nicht vollständig implementiert')
    // if (!confirm('Möchten Sie diese Rolle wirklich löschen?')) return
    // try {
    //   setRoles(roles.filter(role => role.value !== value))
    // } catch (err) {
    //   console.error('Fehler beim Löschen der Rolle:', err)
    //   alert('Fehler beim Löschen: ' + err.message)
    // }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'available'
      case 'maintenance': return 'maintenance'
      case 'out_of_order': return 'out_of_order'
      default: return 'available'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Verfügbar'
      case 'maintenance': return 'Wartung'
      case 'out_of_order': return 'Außer Betrieb'
      default: return status
    }
  }

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    return category ? category.name : 'Unbekannt'
  }

  const getRoleLabel = (roleValue) => {
    const role = roles.find(r => r.value === roleValue)
    return role ? role.label : roleValue
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Lade...</div>
      </div>
    )
  }

  if (!user) {
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

    if (showUserRegister) {
      return (
        <div className="app">
          <UserRegister 
            onBack={() => setShowUserRegister(false)}
            onSuccess={(data) => {
              console.log('Benutzer erfolgreich registriert:', data);
              setShowUserRegister(false);
            }}
          />
        </div>
      );
    }

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

    return (
      <div className="app">
        <div className="login-container">
          <h1>⏰ BenchTime</h1>
          <form onSubmit={handleLogin} className="login-form">
            <h2>Anmelden</h2>
            <div className="form-group">
              <label htmlFor="username">Benutzername</label>
              <input type="text" id="username" name="username" required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Passwort</label>
              <input type="password" id="password" name="password" required />
            </div>
            <button type="submit" className="btn-primary">Anmelden</button>
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
            
            <div style={{ marginBottom: '20px' }}>
              <button 
                onClick={() => setShowUserRegister(true)}
                className="btn-secondary"
                style={{ 
                  background: 'linear-gradient(135deg, #3498db, #2980b9)',
                  border: 'none',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9em',
                  fontWeight: '600',
                  marginRight: '10px'
                }}
              >
                👤 Benutzer registrieren
              </button>
              
              <button 
                onClick={() => setShowOrganizationRegister(true)}
                className="btn-secondary"
                style={{ 
                  background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
                  border: 'none',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9em',
                  fontWeight: '600'
                }}
              >
                ⏰ Neuen BenchTime-Workspace registrieren
              </button>
            </div>
            
            <p style={{ color: '#7f8c8d', marginBottom: '15px' }}>
              Wähle aus, was du registrieren möchtest
            </p>
          </div>
          
          {/* Footer auch beim Login anzeigen */}
          <footer style={{ marginTop: '40px' }}>
            <div className="version-info">
              <span>{getBuildInfoString()}</span>
              <span>Build: {new Date().toISOString().split('T')[0]}</span>
              <span>BenchTime © 2024</span>
            </div>
          </footer>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header>
        <h1>⏰ BenchTime</h1>
        <div className="user-info">
          <span>Willkommen, {user.person?.name || user.username}!</span>
          <button onClick={handleLogout} className="btn-secondary">Abmelden</button>
        </div>
        <nav>
          <button 
            className={activeTab === 'dashboard' ? 'active' : ''} 
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          {hasPermission('person', 'can_view') && (
            <button 
              className={activeTab === 'persons' ? 'active' : ''} 
              onClick={() => setActiveTab('persons')}
            >
              👥 Personen ({persons.length})
            </button>
          )}
          {hasPermission('resource', 'can_view') && (
            <button 
              className={activeTab === 'resources' ? 'active' : ''} 
              onClick={() => setActiveTab('resources')}
            >
              🛠️ Ressourcen ({resources.length})
            </button>
          )}
          {hasPermission('category', 'can_view') && (
            <button 
              className={activeTab === 'categories' ? 'active' : ''} 
              onClick={() => setActiveTab('categories')}
            >
              📂 Kategorien ({categories.length})
            </button>
          )}
          {isAdmin() && (
            <button 
              className={activeTab === 'admin' ? 'active' : ''} 
              onClick={() => setActiveTab('admin')}
            >
              ⚙️ Admin
            </button>
          )}
        </nav>
      </header>

      <main>
        {activeTab === 'dashboard' && (
          <div className="section">
            <h2>📊 Dashboard</h2>
            <div className="dashboard-stats">
              <div className="stat-card">
                <h3>👥 Personen</h3>
                <p>Gesamt: {persons.length}</p>
                <p>Aktiv: {persons.filter(p => p.active).length}</p>
              </div>
              <div className="stat-card">
                <h3>🛠️ Ressourcen</h3>
                <p>Gesamt: {resources.length}</p>
                <p>Verfügbar: {resources.filter(r => r.status === 'available').length}</p>
              </div>
              <div className="stat-card">
                <h3>📂 Kategorien</h3>
                <p>Gesamt: {categories.length}</p>
              </div>
              <div className="stat-card">
                <h3>🎭 Rollen</h3>
                <p>Ihre Rollen: {user.roles?.map(r => r.name).join(', ') || 'Keine'}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'persons' && hasPermission('person', 'can_view') && (
          <div className="section">
            <div className="section-header">
              <h2>👥 Personen verwalten</h2>
              {hasPermission('person', 'can_create') && (
                <button 
                  className="btn-primary" 
                  onClick={() => {
                    setEditingPerson(null)
                    setPersonForm({ name: '', email: '', roles: ['user'] })
                    setShowPersonForm(true)
                  }}
                >
                  ➕ Person hinzufügen
                </button>
              )}
            </div>
            
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>E-Mail</th>
                    <th>Rollen</th>
                    <th>Status</th>
                    {hasPermission('person', 'can_edit') && <th>Aktionen</th>}
                  </tr>
                </thead>
                <tbody>
                  {persons.map(person => (
                    <tr key={person.id}>
                      <td>{person.name}</td>
                      <td>{person.email}</td>
                      <td>{person.roles.join(', ')}</td>
                      <td>
                        <span className={`status-badge ${person.active ? 'available' : 'out_of_order'}`}>
                          {person.active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </td>
                      {hasPermission('person', 'can_edit') && (
                        <td className="actions">
                          <button 
                            className="btn-secondary" 
                            onClick={() => handlePersonEdit(person)}
                          >
                            ✏️
                          </button>
                          {hasPermission('person', 'can_delete') && (
                            <button 
                              className="btn-danger" 
                              onClick={() => handlePersonDelete(person.id)}
                            >
                              🗑️
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'resources' && hasPermission('resource', 'can_view') && (
          <div className="section">
            <div className="section-header">
              <h2>🛠️ Ressourcen verwalten</h2>
              <button 
                className="btn-primary" 
                onClick={() => {
                  setEditingResource(null)
                  setResourceForm({ name: '', description: '', category_id: '', status: 'available', location: '' })
                  setShowResourceForm(true)
                }}
              >
                ➕ Ressource hinzufügen
              </button>
            </div>
            
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Beschreibung</th>
                    <th>Kategorie</th>
                    <th>Status</th>
                    <th>Standort</th>
                    {hasPermission('resource', 'can_edit') && <th>Aktionen</th>}
                  </tr>
                </thead>
                <tbody>
                  {resources.map(resource => (
                    <tr key={resource.id}>
                      <td>{resource.name}</td>
                      <td>{resource.description || '-'}</td>
                      <td>{getCategoryName(resource.category_id)}</td>
                      <td>
                        <span className={`status-badge ${getStatusColor(resource.status)}`}>
                          {getStatusText(resource.status)}
                        </span>
                      </td>
                      <td>{resource.location || '-'}</td>
                      {hasPermission('resource', 'can_edit') && (
                        <td className="actions">
                          <button 
                            className="btn-secondary" 
                            onClick={() => handleResourceEdit(resource)}
                          >
                            ✏️
                          </button>
                          {hasPermission('resource', 'can_delete') && (
                            <button 
                              className="btn-danger" 
                              onClick={() => handleResourceDelete(resource.id)}
                            >
                              🗑️
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'categories' && hasPermission('category', 'can_view') && (
          <div className="section">
            <div className="section-header">
              <h2>📂 Kategorien verwalten</h2>
              <button 
                className="btn-primary" 
                onClick={() => {
                  setEditingCategory(null)
                  setCategoryForm({ name: '', description: '', icon: '', color: '#007bff' })
                  setShowCategoryForm(true)
                }}
              >
                ➕ Kategorie hinzufügen
              </button>
            </div>
            
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Beschreibung</th>
                    <th>Icon</th>
                    <th>Farbe</th>
                    {hasPermission('category', 'can_edit') && <th>Aktionen</th>}
                  </tr>
                </thead>
                <tbody>
                  {categories.map(category => (
                    <tr key={category.id}>
                      <td>{category.name}</td>
                      <td>{category.description || '-'}</td>
                      <td>{category.icon || '-'}</td>
                      <td>
                        <div className="color-preview" style={{ backgroundColor: category.color || '#007bff' }}></div>
                      </td>
                      {hasPermission('category', 'can_edit') && (
                        <td className="actions">
                          <button 
                            className="btn-secondary" 
                            onClick={() => handleCategoryEdit(category)}
                          >
                            ✏️
                          </button>
                          {hasPermission('category', 'can_delete') && (
                            <button 
                              className="btn-danger" 
                              onClick={() => handleCategoryDelete(category.id)}
                            >
                              🗑️
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'admin' && isAdmin() && (
          <div className="section">
            <h2>⚙️ Admin-Bereich</h2>
            <p>Hier können Sie Rollen und Berechtigungen verwalten.</p>
            <div className="admin-actions">
              <button className="btn-primary" onClick={() => window.open('/.netlify/functions/admin/docs', '_blank')}>
                📚 Admin API Docs
              </button>
              <button className="btn-primary" onClick={() => window.open('/.netlify/functions/auth/docs', '_blank')}>
                🔐 Auth API Docs
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Person Form Modal */}
      {showPersonForm && (
        <div className="modal" onClick={() => setShowPersonForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editingPerson ? 'Person bearbeiten' : 'Neue Person hinzufügen'}</h2>
            <form onSubmit={handlePersonSubmit}>
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  value={personForm.name}
                  onChange={(e) => setPersonForm({...personForm, name: e.target.value})}
                  required
                  minLength="2"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">E-Mail *</label>
                <input
                  type="email"
                  id="email"
                  value={personForm.email}
                  onChange={(e) => setPersonForm({...personForm, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="roles">Rollen *</label>
                <select
                  id="roles"
                  value={personForm.roles[0] || ''}
                  onChange={(e) => setPersonForm({...personForm, roles: [e.target.value]})}
                  required
                >
                  <option value="">Rolle auswählen...</option>
                  <option value="user">Benutzer</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowPersonForm(false)}
                >
                  Abbrechen
                </button>
                <button type="submit" className="btn-primary">
                  {editingPerson ? 'Aktualisieren' : 'Hinzufügen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resource Form Modal */}
      {showResourceForm && (
        <div className="modal" onClick={() => setShowResourceForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editingResource ? 'Ressource bearbeiten' : 'Neue Ressource hinzufügen'}</h2>
            <form onSubmit={handleResourceSubmit}>
              <div className="form-group">
                <label htmlFor="resourceName">Name *</label>
                <input
                  type="text"
                  id="resourceName"
                  value={resourceForm.name}
                  onChange={(e) => setResourceForm({...resourceForm, name: e.target.value})}
                  required
                  minLength="2"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Beschreibung</label>
                <textarea
                  id="description"
                  value={resourceForm.description}
                  onChange={(e) => setResourceForm({...resourceForm, description: e.target.value})}
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="category">Kategorie</label>
                <select
                  id="category"
                  value={resourceForm.category_id}
                  onChange={(e) => setResourceForm({...resourceForm, category_id: e.target.value})}
                >
                  <option value="">Kategorie auswählen...</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={resourceForm.status}
                  onChange={(e) => setResourceForm({...resourceForm, status: e.target.value})}
                >
                  <option value="available">Verfügbar</option>
                  <option value="maintenance">Wartung</option>
                  <option value="out_of_order">Außer Betrieb</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="location">Standort</label>
                <input
                  type="text"
                  id="location"
                  value={resourceForm.location}
                  onChange={(e) => setResourceForm({...resourceForm, location: e.target.value})}
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowResourceForm(false)}
                >
                  Abbrechen
                </button>
                <button type="submit" className="btn-primary">
                  {editingResource ? 'Aktualisieren' : 'Hinzufügen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="modal" onClick={() => setShowCategoryForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editingCategory ? 'Kategorie bearbeiten' : 'Neue Kategorie hinzufügen'}</h2>
            <form onSubmit={handleCategorySubmit}>
              <div className="form-group">
                <label htmlFor="categoryName">Name *</label>
                <input
                  type="text"
                  id="categoryName"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                  required
                  minLength="2"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="categoryDescription">Beschreibung</label>
                <textarea
                  id="categoryDescription"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="categoryIcon">Icon</label>
                <input
                  type="text"
                  id="categoryIcon"
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm({...categoryForm, icon: e.target.value})}
                  placeholder="z.B. machine, room, tool"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="categoryColor">Farbe</label>
                <input
                  type="color"
                  id="categoryColor"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({...categoryForm, color: e.target.value})}
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowCategoryForm(false)}
                >
                  Abbrechen
                </button>
                <button type="submit" className="btn-primary">
                  {editingCategory ? 'Aktualisieren' : 'Hinzufügen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Form Modal */}
      {/* This modal is no longer needed as role management is handled by admin API */}
      {/* {showRoleForm && (
        <div className="modal" onClick={() => setShowRoleForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editingRole ? 'Rolle bearbeiten' : 'Neue Rolle hinzufügen'}</h2>
            <form onSubmit={handleRoleSubmit}>
              <div className="form-group">
                <label htmlFor="roleValue">Code *</label>
                <input
                  type="text"
                  id="roleValue"
                  value={roleForm.value}
                  onChange={(e) => setRoleForm({...roleForm, value: e.target.value})}
                  required
                  minLength="2"
                  placeholder="z.B. user, admin, coach"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="roleLabel">Anzeigename *</label>
                <input
                  type="text"
                  id="roleLabel"
                  value={roleForm.label}
                  onChange={(e) => setRoleForm({...roleForm, label: e.target.value})}
                  required
                  minLength="2"
                  placeholder="z.B. Benutzer, Administrator, Coach"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="roleDescription">Beschreibung</label>
                <textarea
                  id="roleDescription"
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                  rows="3"
                  placeholder="Beschreibung der Rolle und ihrer Berechtigungen"
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowRoleForm(false)}
                >
                  Abbrechen
                </button>
                <button type="submit" className="btn-primary">
                  {editingRole ? 'Aktualisieren' : 'Hinzufügen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )} */}

      {showResetPassword && (
        <div className="reset-password-container">
          <ResetPassword 
            token={resetToken}
            onSuccess={(data) => {
              console.log('Passwort erfolgreich zurückgesetzt:', data);
              // Optional: Weiterleitung zum Login
            }}
            onError={(error) => {
              console.error('Fehler beim Zurücksetzen:', error);
            }}
          />
        </div>
      )}

      <footer>
        <p>
          📚 <a href="/swagger.html" target="_blank">API-Dokumentation</a> | 
          🔐 <a href="/.netlify/functions/auth/docs" target="_blank">Auth API</a> |
          ⚙️ <a href="/.netlify/functions/admin/docs" target="_blank">Admin API</a>
        </p>
        <div className="version-info">
          <span>{getBuildInfoString()}</span>
          <span>Build: {new Date().toISOString().split('T')[0]}</span>
          <span>BenchTime © 2024</span>
        </div>
      </footer>
    </div>
  )
}

export default App
