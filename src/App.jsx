import './App.css'
import { useEffect, useState } from 'react'

function App() {
  const [message, setMessage] = useState('Loading...')

  useEffect(() => {
    async function fetchHello() {
      try {
        const response = await fetch('http://127.0.0.1:8000/hello')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const text = await response.text()
        setMessage(text)
      } catch (error) {
        if (error instanceof TypeError) {
          setMessage(
            'NetworkError when attempting to fetch resource. Please ensure the server is running and CORS is configured correctly.'
          )
        } else {
          setMessage(error.message)
        }
      }
    }

    fetchHello()
  }, [])

  return <div className="p-4">{message}</div>
}

export default App
