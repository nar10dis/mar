import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { io } from 'socket.io-client'

interface Message {
  id: number
  author: string
  content: string
  createdAt: string
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [connected, setConnected] = useState(false)
  const [author, setAuthor] = useState(() => localStorage.getItem('author') ?? '')
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    fetch('/api/messages')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))))
      .then((data: Message[]) => setMessages(data))
      .catch(() => setError('Impossible de charger les messages.'))

    const socket = io()
    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('message:new', (m: Message) =>
      setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m])),
    )
    return () => {
      socket.disconnect()
    }
  }, [])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages])

  async function send(e: FormEvent) {
    e.preventDefault()
    setError(null)
    localStorage.setItem('author', author)
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, content }),
    })
    if (res.ok) setContent('')
    else setError("Échec de l'envoi.")
  }

  return (
    <main className="app">
      <header>
        <h1>mar demo</h1>
        <span className="status">
          <span className={connected ? 'dot on' : 'dot'} />
          {connected ? 'temps réel connecté' : 'déconnecté'}
        </span>
      </header>

      <ul className="list" ref={listRef}>
        {messages.length === 0 && <li className="empty">Aucun message pour l'instant.</li>}
        {messages.map((m) => (
          <li key={m.id}>
            <div className="meta">
              <b>{m.author}</b>
              {new Date(m.createdAt).toLocaleTimeString()}
            </div>
            {m.content}
          </li>
        ))}
      </ul>

      <form onSubmit={send}>
        <input className="author" placeholder="Ton nom" value={author} onChange={(e) => setAuthor(e.target.value)} required maxLength={50} />
        <input className="content" placeholder="Message" value={content} onChange={(e) => setContent(e.target.value)} required maxLength={1000} />
        <button disabled={!author.trim() || !content.trim()}>Envoyer</button>
      </form>
      {error && <p className="error">{error}</p>}
    </main>
  )
}
