import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [persons, setPersons] = useState([])
  const [resources, setResources] = useState([])
  const [categories, setCategories] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState('')
  const [sortDirection, setSortDirection] = useState('asc')

  // Form states and data for all entities
  const [showPersonForm, setShowPersonForm] = useState(false)
  const [showResourceForm, setShowResourceForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showRoleForm, setShowRoleForm] = useState(false)
  const [editingPerson, setEditingPerson] = useState(null)
  const [editingResource, setEditingResource] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingRole, setEditingRole] = useState(null)
  const [personForm, setPersonForm] = useState({ name: '', email: '', roles: ['user'] })
  const [resourceForm, setResourceForm] = useState({ 
    name: '', 
    description: '', 
    category_id: '', 
    status: 'available', 
    location: '' 
  })
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: '', color: '#007bff' })
  const [roleForm, setRoleForm] = useState({ value: '', label: '', description: '' })

  // Predefined roles for dropdown (will be replaced by database roles)
  const availableRoles = [
    { value: 'user', label: 'Benutzer' },
    { value: 'staff', label: 'Mitarbeiter' },
    { value: 'coach', label: 'Coach' },
    { value: 'admin', label: 'Administrator' },
    { value: 'ceo', label: 'CEO' },
    { value: 'cto', label: 'CTO' },
    { value: 'instructor', label: 'Instruktor' },
    { value: 'maintenance', label: 'Wartung' }
  ]

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
      const [personsRes, resourcesRes, categoriesRes] = await Promise.all([
        fetch(`${apiBase}/person`),
        fetch(`${apiBase}/resource`),
        fetch(`${apiBase}/category`)
      ])

      if (!personsRes.ok) throw new Error(`HTTP error! status: ${personsRes.status}`)
      if (!resourcesRes.ok) throw new Error(`HTTP error! status: ${resourcesRes.status}`)
      if (!categoriesRes.ok) throw new Error(`HTTP error! status: ${categoriesRes.status}`)

      const [personsData, resourcesData, categoriesData] = await Promise.all([
        personsRes.json(),
        resourcesRes.json(),
        categoriesRes.json()
      ])

      setPersons(personsData)
      setResources(resourcesData)
      setCategories(categoriesData)
      
      // For now, use predefined roles until we have a roles API
      setRoles(availableRoles)
    } catch (err) {
      console.error('Fehler beim Laden der Daten:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Dashboard statistics
  const getDashboardStats = () => {
    const totalPersons = persons.length
    const activePersons = persons.filter(p => p.active).length
    const totalResources = resources.length
    const availableResources = resources.filter(r => r.status === 'available').length
    const maintenanceResources = resources.filter(r => r.status === 'maintenance').length
    const outOfOrderResources = resources.filter(r => r.status === 'out_of_order').length
    const totalCategories = categories.length
    const totalRoles = roles.length

    return {
      totalPersons,
      activePersons,
      totalResources,
      availableResources,
      maintenanceResources,
      outOfOrderResources,
      totalCategories,
      totalRoles
    }
  } 

  const getRecentItems = () => {
    const recentPersons = persons.slice(-3).reverse()
    const recentResources = resources.slice(-3).reverse()
    const recentCategories = categories.slice(-3).reverse()

    return { recentPersons, recentResources, recentCategories }
  }

  const getResourceStatusDistribution = () => {
    const stats = getDashboardStats()
    return [
      { label: 'Verfügbar', value: stats.availableResources, color: '#28a745' },
      { label: 'Wartung', value: stats.maintenanceResources, color: '#ffc107' },
      { label: 'Außer Betrieb', value: stats.outOfOrderResources, color: '#dc3545' }
    ]
  }

  // Search and filter functions
  const filterData = (data, searchTerm) => {
    if (!searchTerm) return data
    return data.filter(item => {
      if (activeTab === 'persons') {
        return item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
               item.roles.some(role => role.toLowerCase().includes(searchTerm.toLowerCase()))
      } else if (activeTab === 'resources') {
        return item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
               (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase()))
      } else if (activeTab === 'categories') {
        return item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      } else if (activeTab === 'roles') {
        return item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
               item.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
               (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      }
      return false
    })
  }

  const sortData = (data, field, direction) => {
    if (!field) return data
    return [...data].sort((a, b) => {
      let aVal = a[field]
      let bVal = b[field]
      
      if (field === 'roles' && Array.isArray(aVal)) {
        aVal = aVal.join(', ')
        bVal = bVal.join(', ')
      }
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1
      if (aVal > bVal) return direction === 'asc' ? 1 : -1
      return 0
    })
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortedData = () => {
    let data = []
    if (activeTab === 'persons') data = persons
    else if (activeTab === 'resources') data = resources
    else if (activeTab === 'categories') data = categories
    else if (activeTab === 'roles') data = roles

    const filteredData = filterData(data, searchTerm)
    return sortData(filteredData, sortField, sortDirection)
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

      loadData()
    } catch (err) {
      console.error('Fehler beim Löschen der Person:', err)
      alert('Fehler beim Löschen: ' + err.message)
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
    if (!confirm('Möchten Sie diese Ressource wirklich löschen?')) return
    
    try {
      const response = await fetch(`${apiBase}/resource/${id}`, {
        method: 'DELETE'
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
    try {
      const url = editingCategory 
        ? `${apiBase}/category/${editingCategory.id}`
        : `${apiBase}/category`
      
      const method = editingCategory ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
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
    if (!confirm('Möchten Sie diese Kategorie wirklich löschen?')) return
    
    try {
      const response = await fetch(`${apiBase}/category/${id}`, {
        method: 'DELETE'
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
    try {
      // For now, just update local state since we don't have a roles API yet
      if (editingRole) {
        setRoles(roles.map(role => 
          role.value === editingRole.value ? roleForm : role
        ))
      } else {
        setRoles([...roles, roleForm])
      }

      setShowRoleForm(false)
      setEditingRole(null)
      setRoleForm({ value: '', label: '', description: '' })
    } catch (err) {
      console.error('Fehler beim Speichern der Rolle:', err)
      alert('Fehler beim Speichern: ' + err.message)
    }
  }

  const handleRoleEdit = (role) => {
    setEditingRole(role)
    setRoleForm({
      value: role.value,
      label: role.label,
      description: role.description || ''
    })
    setShowRoleForm(true)
  }

  const handleRoleDelete = async (value) => {
    if (!confirm('Möchten Sie diese Rolle wirklich löschen?')) return
    
    try {
      setRoles(roles.filter(role => role.value !== value))
    } catch (err) {
      console.error('Fehler beim Löschen der Rolle:', err)
      alert('Fehler beim Löschen: ' + err.message)
    }
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
        <header>
          <h1>🏭 Makerspace Verwaltung</h1>
        </header>
        <main>
          <div className="loading">Lade Daten...</div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app">
        <header>
          <h1>🏭 Makerspace Verwaltung</h1>
        </header>
        <main>
          <div className="error">
            <h2>Fehler beim Laden der Daten</h2>
            <p>{error}</p>
            <button className="btn-primary" onClick={loadData}>Erneut versuchen</button>
          </div>
        </main>
      </div>
    )
  }

  const sortedData = getSortedData()

  return (
    <div className="app">
      <header>
        <h1>🏭 Makerspace Verwaltung</h1>
        <nav>
          <button 
            className={activeTab === 'dashboard' ? 'active' : ''} 
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
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
          <button 
            className={activeTab === 'categories' ? 'active' : ''} 
            onClick={() => setActiveTab('categories')}
          >
            📂 Kategorien ({categories.length})
          </button>
          <button 
            className={activeTab === 'roles' ? 'active' : ''} 
            onClick={() => setActiveTab('roles')}
          >
            🎭 Rollen ({roles.length})
          </button>
        </nav>
      </header>

      <main>
        {activeTab === 'dashboard' && (
          <div className="section">
            <h2>📊 Dashboard</h2>
            <div className="dashboard-stats">
              <div className="stat-card">
                <h3>👥 Personen</h3>
                <p>Gesamt: {getDashboardStats().totalPersons}</p>
                <p>Aktiv: {getDashboardStats().activePersons}</p>
              </div>
              <div className="stat-card">
                <h3>🛠️ Ressourcen</h3>
                <p>Gesamt: {getDashboardStats().totalResources}</p>
                <p>Verfügbar: {getDashboardStats().availableResources}</p>
                <p>Wartung: {getDashboardStats().maintenanceResources}</p>
                <p>Außer Betrieb: {getDashboardStats().outOfOrderResources}</p>
              </div>
              <div className="stat-card">
                <h3>📂 Kategorien</h3>
                <p>Gesamt: {getDashboardStats().totalCategories}</p>
              </div>
              <div className="stat-card">
                <h3>🎭 Rollen</h3>
                <p>Gesamt: {getDashboardStats().totalRoles}</p>
              </div>
            </div>

            <h3>🔍 Aktuelle Suchen und Filter</h3>
            <div className="search-filters">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Suchen nach Name, E-Mail oder Rolle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="sort-select">
                <label htmlFor="sortField">Sortieren nach:</label>
                <select id="sortField" value={sortField} onChange={(e) => handleSort(e.target.value)}>
                  <option value="">Keine Sortierung</option>
                  <option value="name">Name</option>
                  <option value="email">E-Mail</option>
                  <option value="roles">Rollen</option>
                  <option value="active">Status</option>
                </select>
                <select id="sortDirection" value={sortDirection} onChange={(e) => setSortDirection(e.target.value)}>
                  <option value="asc">Aufsteigend</option>
                  <option value="desc">Absteigend</option>
                </select>
              </div>
            </div>

                         <h3>👥 Letzte Personen</h3>
             <div className="recent-items">
               {getRecentItems().recentPersons.length === 0 ? (
                 <p>Keine neuen Personen hinzugefügt.</p>
               ) : (
                 getRecentItems().recentPersons.map(person => (
                   <div key={person.id} className="item-card">
                     <h4>{person.name}</h4>
                     <p>E-Mail: {person.email}</p>
                     <p>Rollen: {person.roles.map(role => getRoleLabel(role)).join(', ')}</p>
                     <p>Status: <span className={`status-badge ${person.active ? 'available' : 'out_of_order'}`}>
                       {person.active ? 'Aktiv' : 'Inaktiv'}
                     </span></p>
                     <div className="actions">
                       <button className="btn-secondary" onClick={() => handlePersonEdit(person)}>Bearbeiten</button>
                       <button className="btn-danger" onClick={() => handlePersonDelete(person.id)}>Löschen</button>
                     </div>
                   </div>
                 ))
               )}
             </div>

             <h3>🛠️ Letzte Ressourcen</h3>
             <div className="recent-items">
               {getRecentItems().recentResources.length === 0 ? (
                 <p>Keine neuen Ressourcen hinzugefügt.</p>
               ) : (
                 getRecentItems().recentResources.map(resource => (
                   <div key={resource.id} className="item-card">
                     <h4>{resource.name}</h4>
                     <p>Kategorie: {getCategoryName(resource.category_id)}</p>
                     <p>Status: <span className={`status-badge ${getStatusColor(resource.status)}`}>
                       {getStatusText(resource.status)}
                     </span></p>
                     <p>Standort: {resource.location || '-'}</p>
                     <div className="actions">
                       <button className="btn-secondary" onClick={() => handleResourceEdit(resource)}>Bearbeiten</button>
                       <button className="btn-danger" onClick={() => handleResourceDelete(resource.id)}>Löschen</button>
                     </div>
                   </div>
                 ))
               )}
             </div>

             <h3>📂 Letzte Kategorien</h3>
             <div className="recent-items">
               {getRecentItems().recentCategories.length === 0 ? (
                 <p>Keine neuen Kategorien hinzugefügt.</p>
               ) : (
                 getRecentItems().recentCategories.map(category => (
                   <div key={category.id} className="item-card">
                     <h4>{category.name}</h4>
                     <p>Beschreibung: {category.description || '-'}</p>
                     <p>Icon: {category.icon || '-'}</p>
                     <div className="actions">
                       <button className="btn-secondary" onClick={() => handleCategoryEdit(category)}>Bearbeiten</button>
                       <button className="btn-danger" onClick={() => handleCategoryDelete(category.id)}>Löschen</button>
                     </div>
                   </div>
                 ))
               )}
             </div>
          </div>
        )}

        {activeTab === 'persons' && (
          <div className="section">
            <div className="section-header">
              <h2>👥 Personen verwalten</h2>
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
            </div>
            
            <div className="table-controls">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Suchen nach Name, E-Mail oder Rolle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('name')} className="sortable">
                      Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('email')} className="sortable">
                      E-Mail {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('roles')} className="sortable">
                      Rollen {sortField === 'roles' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('active')} className="sortable">
                      Status {sortField === 'active' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="no-data">
                        {searchTerm ? 'Keine Ergebnisse gefunden' : 'Keine Personen vorhanden'}
                      </td>
                    </tr>
                  ) : (
                    sortedData.map(person => (
                      <tr key={person.id}>
                        <td>{person.name}</td>
                        <td>{person.email}</td>
                        <td>{person.roles.map(role => getRoleLabel(role)).join(', ')}</td>
                        <td>
                          <span className={`status-badge ${person.active ? 'available' : 'out_of_order'}`}>
                            {person.active ? 'Aktiv' : 'Inaktiv'}
                          </span>
                        </td>
                        <td className="actions">
                          <button 
                            className="btn-secondary" 
                            onClick={() => handlePersonEdit(person)}
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-danger" 
                            onClick={() => handlePersonDelete(person.id)}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
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
            
            <div className="table-controls">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Suchen nach Name, Beschreibung oder Standort..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('name')} className="sortable">
                      Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('description')} className="sortable">
                      Beschreibung {sortField === 'description' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Kategorie</th>
                    <th onClick={() => handleSort('status')} className="sortable">
                      Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('location')} className="sortable">
                      Standort {sortField === 'location' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-data">
                        {searchTerm ? 'Keine Ergebnisse gefunden' : 'Keine Ressourcen vorhanden'}
                      </td>
                    </tr>
                  ) : (
                    sortedData.map(resource => (
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
                        <td className="actions">
                          <button 
                            className="btn-secondary" 
                            onClick={() => handleResourceEdit(resource)}
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-danger" 
                            onClick={() => handleResourceDelete(resource.id)}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
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
            
            <div className="table-controls">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Suchen nach Name oder Beschreibung..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('name')} className="sortable">
                      Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('description')} className="sortable">
                      Beschreibung {sortField === 'description' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('icon')} className="sortable">
                      Icon {sortField === 'icon' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Farbe</th>
                    <th>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="no-data">
                        {searchTerm ? 'Keine Ergebnisse gefunden' : 'Keine Kategorien vorhanden'}
                      </td>
                    </tr>
                  ) : (
                    sortedData.map(category => (
                      <tr key={category.id}>
                        <td>{category.name}</td>
                        <td>{category.description || '-'}</td>
                        <td>{category.icon || '-'}</td>
                        <td>
                          <div className="color-preview" style={{ backgroundColor: category.color || '#007bff' }}></div>
                        </td>
                        <td className="actions">
                          <button 
                            className="btn-secondary" 
                            onClick={() => handleCategoryEdit(category)}
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-danger" 
                            onClick={() => handleCategoryDelete(category.id)}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="section">
            <div className="section-header">
              <h2>🎭 Rollen verwalten</h2>
              <button 
                className="btn-primary" 
                onClick={() => {
                  setEditingRole(null)
                  setRoleForm({ value: '', label: '', description: '' })
                  setShowRoleForm(true)
                }}
              >
                ➕ Rolle hinzufügen
              </button>
            </div>
            
            <div className="table-controls">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Suchen nach Code, Name oder Beschreibung..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('label')} className="sortable">
                      Name {sortField === 'label' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('value')} className="sortable">
                      Code {sortField === 'value' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('description')} className="sortable">
                      Beschreibung {sortField === 'description' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="no-data">
                        {searchTerm ? 'Keine Ergebnisse gefunden' : 'Keine Rollen vorhanden'}
                      </td>
                    </tr>
                  ) : (
                    sortedData.map(role => (
                      <tr key={role.value}>
                        <td>{role.label}</td>
                        <td>{role.value}</td>
                        <td>{role.description || '-'}</td>
                        <td className="actions">
                          <button 
                            className="btn-secondary" 
                            onClick={() => handleRoleEdit(role)}
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-danger" 
                            onClick={() => handleRoleDelete(role.value)}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
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
      {showRoleForm && (
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
      )}

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
