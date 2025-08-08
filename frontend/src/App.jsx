import { useEffect, useState } from 'react'

function App() {
  const [people, setPeople] = useState([])

  useEffect(() => {
    fetch('/api/person')
      .then((res) => res.json())
      .then(setPeople)
      .catch(console.error)
  }, [])

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Makerspace – Personen</h1>
      <ul>
        {people.map((p) => (
          <li key={p.id}>
            {p.name} ({p.email}) – Rollen: {p.roles.join(', ')}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
