'use client'
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle, Send, X, Loader2 } from 'lucide-react'

type Message = {
  sender: 'user' | 'bot'
  text: string
}

export default function ChatWidget() {
  const pathname = usePathname()
  const isHiddenRoute = pathname === '/carrito' || pathname === '/checkout'

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: '¡Hola! Soy Melissa 👋 ¿En qué te puedo ayudar hoy?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    
    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }])
    setLoading(true)
    setIsTyping(true)

    try {
      // Build history (excluding the first greeting message to keep it clean)
      const history = messages
        .filter((_, idx) => idx > 0)
        .map(msg => ({
          sender: msg.sender,
          text: msg.text
        }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history
        })
      })

      const data = await response.json()

      if (response.ok && data.reply) {
        setMessages(prev => [...prev, { sender: 'bot', text: data.reply }])
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: 'Lo siento, en este momento tengo problemas de conexión. Por favor intenta más tarde.' }])
      }
    } catch {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Ocurrió un error al enviar el mensaje. ¿Puedes intentarlo nuevamente?' }])
    } finally {
      setLoading(false)
      setIsTyping(false)
    }
  }

  if (isHiddenRoute && !isOpen) {
    return null
  }

  return (
    <div style={{ position: 'fixed', bottom: 140, right: 16, zIndex: 60, fontFamily: 'system-ui, sans-serif' }}>
      {/* Floating Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: 80,
          right: 0,
          width: '360px',
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 180px)',
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          animation: 'fadeUp 0.25s ease-out'
        }}>
          {/* Header */}
          <div style={{
            backgroundColor: 'var(--brand)',
            color: '#FFFFFF',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 14
              }}>
                M
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Melissa IA 🛍️</div>
                <div style={{ fontSize: 11, opacity: 0.9 }}>Asesora de compras online</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages list */}
          <div style={{
            flexGrow: 1,
            overflowY: 'auto',
            padding: '16px',
            backgroundColor: 'var(--bg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            {messages.map((msg, index) => {
              const isUser = msg.sender === 'user'
              return (
                <div key={index} style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{
                    backgroundColor: isUser ? 'var(--brand)' : '#E5E7EB',
                    color: isUser ? '#FFFFFF' : 'var(--text)',
                    padding: '10px 14px',
                    borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    fontSize: 13,
                    lineHeight: '1.4',
                    whiteSpace: 'pre-line',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}>
                    {msg.text}
                  </div>
                </div>
              )
            })}
            
            {/* Writing status indicator */}
            {isTyping && (
              <div style={{
                alignSelf: 'flex-start',
                backgroundColor: '#E5E7EB',
                color: 'var(--text)',
                padding: '10px 14px',
                borderRadius: '16px 16px 16px 2px',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}>
                <span style={{ fontSize: 12, color: '#6B7280' }}>Melissa está escribiendo</span>
                <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: '10px' }}>
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Send Input Form */}
          <form onSubmit={handleSend} style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: 8,
            backgroundColor: '#FFFFFF'
          }}>
            <input
              type="text"
              placeholder="Pregúntame sobre envíos, vestidos..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              style={{
                flexGrow: 1,
                border: '1px solid var(--border)',
                borderRadius: 999,
                padding: '10px 16px',
                fontSize: 13,
                outline: 'none',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)'
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              style={{
                backgroundColor: (input.trim() && !loading) ? 'var(--brand)' : '#F3F4F6',
                color: (input.trim() && !loading) ? '#FFFFFF' : 'var(--text-muted)',
                border: 'none',
                width: 38,
                height: 38,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (input.trim() && !loading) ? 'pointer' : 'default',
                transition: 'background 0.2s'
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Launcher Button */}
      {!isHiddenRoute && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: 'var(--brand)',
            color: '#FFFFFF',
            border: 'none',
            boxShadow: '0 4px 16px rgba(139, 34, 82, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            animation: 'pulse 2s infinite'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <MessageCircle size={26} />
        </button>
      )}

      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(139, 34, 82, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(139, 34, 82, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(139, 34, 82, 0);
          }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .dot {
          display: inline-block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: #6B7280;
          animation: bounce 1.4s infinite ease-in-out;
        }
        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }
      `}</style>
    </div>
  )
}
