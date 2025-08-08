import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('persons')
  const [persons, setPersons] = useState([])
  const [resources, setResources] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Form states
  const [showPersonForm, setShowPersonForm] = useState(false)
  const [showResourceForm, setShowResourceForm] = useState(false)
  const [editingPerson, setEditingPerson] = useState(null)
  const [editingResource, setEditingResource] = useState(null)

  // Form data
  const [personForm, setPersonForm] = useState({
    name: '',
    email: '',
    roles: ['user']
  })

  const [resourceForm, setResourceForm] = useState({
    name: '',
    description: '',
    category_id: '',
    status: 'available',
    location: '',
    specifications: {},
    image_url: ''
  })

  // API base URL
  const apiBase = import.meta.env.DEV
    ? 'http://localhost:8888/.netlify/functions'
    : '/.netlify/functions'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Load persons
      const personsResponse = await fetch(`${apiBase}/person`)
      if (!personsResponse.ok) throw new Error(`HTTP error! status: ${personsResponse.status}`)
      const personsData = await personsResponse.json()
      setPersons(personsData)

      // Load resources
      const resourcesResponse = await fetch(`${apiBase}/resource`)
      if (!resourcesResponse.ok) throw new Error(`HTTP error! status: ${resourcesResponse.status}`)
      const resourcesData = await resourcesResponse.json()
      setResources(resourcesData)

      // Load categories
      const categoriesResponse = await fetch(`${apiBase}/category`)
      if (!categoriesResponse.ok) throw new Error(`HTTP error! status: ${categoriesResponse.status}`)
      const categoriesData = await categoriesResponse.json()
      setCategories(categoriesData)

      setLoading(false)
    } catch (err) {
      console.error('❌ Error loading data:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  // Person CRUD operations
  const handlePersonSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const url = editingPerson 
        ? `${apiBase}/person/${editingPerson.id}`
        : `${apiBase}/person`
      
      const method = editingPerson ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personForm)
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      
      await loadData()
      setShowPersonForm(false)
      setEditingPerson(null)
      setPersonForm({ name: '', email: '', roles: ['user'] })
    } catch (err) {
      console.error('❌ Error saving person:', err)
      setError(err.message)
    }
  }

  const handlePersonEdit = (person) => {
    setEditingPerson(person)
    setPersonForm({
      name: person.name,
      email: person.email,
      roles: person.roles
    })
    setShowPersonForm(true)
  }

  const handlePersonDelete = async (id) => {
    if (!confirm('Möchten Sie diese Person wirklich löschen?')) return
    
    try {
      const response = await fetch(`${apiBase}/person/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      
      await loadData()
    } catch (err) {
      console.error('❌ Error deleting person:', err)
      setError(err.message)
    }
  }

  // Resource CRUD operations
  const handleResourceSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const url = editingResource 
        ? `${apiBase}/resource/${editingResource.id}`
        : `${apiBase}/resource`
      
      const method = editingResource ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resourceForm)
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      
      await loadData()
      setShowResourceForm(false)
      setEditingResource(null)
      setResourceForm({
        name: '',
        description: '',
        category_id: '',
        status: 'available',
        location: '',
        specifications: {},
        image_url: ''
      })
    } catch (err) {
      console.error('❌ Error saving resource:', err)
      setError(err.message)
    }
  }

  const handleResourceEdit = (resource) => {
    setEditingResource(resource)
    setResourceForm({
      name: resource.name,
      description: resource.description || '',
      category_id: resource.category_id,
      status: resource.status,
      location: resource.location || '',
      specifications: resource.specifications || {},
      image_url: resource.image_url || ''
    })
    setShowResourceForm(true)
  }

  const handleResourceDelete = async (id) => {
    if (!confirm('Möchten Sie diese Ressource wirklich löschen?')) return
    
    try {
      const response = await fetch(`${apiBase}/resource/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      
      await loadData()
    } catch (err) {
      console.error('❌ Error deleting resource:', err)
      setError(err.message)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#4CAF50'
      case 'maintenance': return '#FF9800'
      case 'out_of_order': return '#F44336'
      default: return '#9E9E9E'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Verfügbar'
      case 'maintenance': return 'Wartung'
      case 'out_of_order': return 'Defekt'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <h1>Makerspace Verwaltung</h1>
          <p>Lade Daten...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <h1>Makerspace Verwaltung</h1>
          <p style={{ color: 'red' }}>Fehler beim Laden der Daten: {error}</p>
          <button onClick={loadData}>Erneut versuchen</button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header>
        <h1>🏭 Makerspace Verwaltung</h1>
        <nav>
          <button 
            className={activeTab === 'persons' ? 'active' : ''}
            onClick={() => setActiveTab('persons')}
          >
            👥 Personen ({persons.length})
          </button>
          <button 
            className={activeTab === 'resources' ? 'active' : ''}
            onClick={() => setActiveTab('resources')}
          >
            🛠️ Ressourcen ({resources.length})
          </button>
        </nav>
      </header>

      <main>
        {activeTab === 'persons' && (
          <div className="section">
            <div className="section-header">
              <h2>Personen verwalten</h2>
              <button 
                className="btn-primary"
                onClick={() => {
                  setShowPersonForm(true)
                  setEditingPerson(null)
                  setPersonForm({ name: '', email: '', roles: ['user'] })
                }}
              >
                ➕ Neue Person
              </button>
            </div>

            {showPersonForm && (
              <div className="modal">
                <div className="modal-content">
                  <h3>{editingPerson ? 'Person bearbeiten' : 'Neue Person'}</h3>
                  <form onSubmit={handlePersonSubmit}>
                    <div className="form-group">
                      <label>Name:</label>
                      <input
                        type="text"
                        value={personForm.name}
                        onChange={(e) => setPersonForm({...personForm, name: e.target.value})}
                        required
                        minLength={2}
                      />
                    </div>
                    <div className="form-group">
                      <label>E-Mail:</label>
                      <input
                        type="email"
                        value={personForm.email}
                        onChange={(e) => setPersonForm({...personForm, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Rollen:</label>
                      <input
                        type="text"
                        value={personForm.roles.join(', ')}
                        onChange={(e) => setPersonForm({
                          ...personForm, 
                          roles: e.target.value.split(',').map(r => r.trim()).filter(r => r)
                        })}
                        placeholder="admin, user, coach"
                        required
                      />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-primary">
                        {editingPerson ? 'Aktualisieren' : 'Erstellen'}
                      </button>
                      <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={() => {
                          setShowPersonForm(false)
                          setEditingPerson(null)
                        }}
                      >
                        Abbrechen
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="list">
              {persons.length === 0 ? (
                <p>Keine Personen gefunden.</p>
              ) : (
                persons.map((person) => (
                  <div key={person.id} className="card">
                    <div className="card-content">
                      <h3>{person.name}</h3>
                      <p>📧 {person.email}</p>
                      <p>🎭 Rollen: {person.roles.join(', ')}</p>
                      <p>📅 Erstellt: {new Date(person.created_at).toLocaleDateString('de-DE')}</p>
                    </div>
                    <div className="card-actions">
                      <button 
                        className="btn-secondary"
                        onClick={() => handlePersonEdit(person)}
                      >
                        ✏️ Bearbeiten
                      </button>
                      <button 
                        className="btn-danger"
                        onClick={() => handlePersonDelete(person.id)}
                      >
                        🗑️ Löschen
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="section">
            <div className="section-header">
              <h2>Ressourcen verwalten</h2>
              <button 
                className="btn-primary"
                onClick={() => {
                  setShowResourceForm(true)
                  setEditingResource(null)
                  setResourceForm({
                    name: '',
                    description: '',
                    category_id: '',
                    status: 'available',
                    location: '',
                    specifications: {},
                    image_url: ''
                  })
                }}
              >
                ➕ Neue Ressource
              </button>
            </div>

            {showResourceForm && (
              <div className="modal">
                <div className="modal-content">
                  <h3>{editingResource ? 'Ressource bearbeiten' : 'Neue Ressource'}</h3>
                  <form onSubmit={handleResourceSubmit}>
                    <div className="form-group">
                      <label>Name:</label>
                      <input
                        type="text"
                        value={resourceForm.name}
                        onChange={(e) => setResourceForm({...resourceForm, name: e.target.value})}
                        required
                        minLength={2}
                      />
                    </div>
                    <div className="form-group">
                      <label>Beschreibung:</label>
                      <textarea
                        value={resourceForm.description}
                        onChange={(e) => setResourceForm({...resourceForm, description: e.target.value})}
                        rows={3}
                      />
                    </div>
                    <div className="form-group">
                      <label>Kategorie:</label>
                      <select
                        value={resourceForm.category_id}
                        onChange={(e) => setResourceForm({...resourceForm, category_id: parseInt(e.target.value)})}
                        required
                      >
                        <option value="">Kategorie wählen...</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Status:</label>
                      <select
                        value={resourceForm.status}
                        onChange={(e) => setResourceForm({...resourceForm, status: e.target.value})}
                      >
                        <option value="available">Verfügbar</option>
                        <option value="maintenance">Wartung</option>
                        <option value="out_of_order">Defekt</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Standort:</label>
                      <input
                        type="text"
                        value={resourceForm.location}
                        onChange={(e) => setResourceForm({...resourceForm, location: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Bild-URL:</label>
                      <input
                        type="url"
                        value={resourceForm.image_url}
                        onChange={(e) => setResourceForm({...resourceForm, image_url: e.target.value})}
                      />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-primary">
                        {editingResource ? 'Aktualisieren' : 'Erstellen'}
                      </button>
                      <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={() => {
                          setShowResourceForm(false)
                          setEditingResource(null)
                        }}
                      >
                        Abbrechen
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="list">
              {resources.length === 0 ? (
                <p>Keine Ressourcen gefunden.</p>
              ) : (
                resources.map((resource) => (
                  <div key={resource.id} className="card">
                    <div className="card-content">
                      <div className="card-header">
                        <h3>{resource.name}</h3>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(resource.status) }}
                        >
                          {getStatusText(resource.status)}
                        </span>
                      </div>
                      {resource.description && <p>{resource.description}</p>}
                      {resource.resource_category && (
                        <p>📂 Kategorie: {resource.resource_category.name}</p>
                      )}
                      {resource.location && <p>📍 Standort: {resource.location}</p>}
                      <p>📅 Erstellt: {new Date(resource.created_at).toLocaleDateString('de-DE')}</p>
                    </div>
                    <div className="card-actions">
                      <button 
                        className="btn-secondary"
                        onClick={() => handleResourceEdit(resource)}
                      >
                        ✏️ Bearbeiten
                      </button>
                      <button 
                        className="btn-danger"
                        onClick={() => handleResourceDelete(resource.id)}
                      >
                        🗑️ Löschen
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      <footer>
        <p>
          📚 <a href="/swagger.html" target="_blank">API-Dokumentation</a> | 
          🔧 <a href="https://github.com/your-repo" target="_blank">GitHub</a>
        </p>
      </footer>
    </div>
  )
}

export default App
