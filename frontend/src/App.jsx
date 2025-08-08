import { useEffect, useState } from 'react'

function App() {
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Für lokale Entwicklung
    const apiUrl = import.meta.env.DEV 
      ? 'http://localhost:8888/.netlify/functions/person'
      : '/.netlify/functions/person';
    
    console.log('🌐 Fetching from:', apiUrl);
    
    fetch(apiUrl)
      .then((res) => {
        console.log('📡 Response status:', res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then((data) => {
        console.log('✅ Data received:', data);
        setPeople(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('❌ Error fetching people:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Makerspace – Personen</h1>
        <p>Lade Daten...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Makerspace – Personen</h1>
        <p style={{ color: 'red' }}>Fehler beim Laden der Daten: {error}</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Makerspace – Personen</h1>
      {people.length === 0 ? (
        <p>Keine Personen gefunden.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {people.map((p) => (
            <li key={p.id} style={{ 
              border: '1px solid #ddd', 
              margin: '10px 0', 
              padding: '15px', 
              borderRadius: '5px',
              backgroundColor: '#f9f9f9'
            }}>
              <strong>{p.name}</strong> ({p.email})
              <br />
              <small>Rollen: {p.roles.join(', ')}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default App
