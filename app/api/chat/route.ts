import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'message es requerido.' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
    const groqApiKey = process.env.GROQ_API_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Faltan credenciales de Supabase en el servidor.' }, { status: 500 })
    }

    if (!groqApiKey || groqApiKey === 'placeholder_groq' || groqApiKey === 'tu_groq_key') {
      return NextResponse.json({ reply: '¡Hola! En este momento no puedo conectarme con mi inteligencia artificial (API Key no configurada), pero puedes explorar nuestro catálogo en /catalogo o revisar tu /carrito.' })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1 & 2. Fetch categories and active products in parallel
    const [{ data: categories }, { data: products }] = await Promise.all([
      supabase.from('categories').select('name').eq('active', true),
      supabase.from('products').select('name, price, sizes, colors, stock, description, categories(name)').eq('active', true).limit(20)
    ])

    const categoriasContext = categories && categories.length > 0
      ? categories.map(c => `- ${c.name}`).join('\n')
      : 'No hay categorías disponibles.'

    const productosContext = products && products.length > 0
      ? products.map(p => {
          const categoryObj = p.categories as any
          const categoryName = categoryObj ? (Array.isArray(categoryObj) ? categoryObj[0]?.name : categoryObj?.name) : 'General'
          const priceStr = p.price ? Number(p.price).toLocaleString('es-CO') : '0'
          const sizesStr = p.sizes && p.sizes.length > 0 ? p.sizes.join(', ') : 'N/A'
          const desc = p.description ? p.description.substring(0, 50).trim().replace(/\n/g, ' ') : ''
          return `- ${p.name}: $${priceStr} | Tallas: ${sizesStr} | Stock: ${p.stock} | ${desc}`
        }).join('\n')
      : 'No hay productos disponibles.'

    // Build the system instructions
    const systemPrompt = `Eres Melissa, asesora de moda de "Variedades Melissa". Eres cálida, femenina y experta en moda.

REGLAS ESTRICTAS:
- SOLO puedes hablar de productos que existen en esta tienda
- NUNCA menciones otras tiendas, marcas externas ni productos que no estén en la lista
- Si no tenemos algo, di "Por ahora no tenemos ese producto, pero tenemos [alternativa de la lista]"
- Cuando el cliente pregunte para quién es el producto, haz preguntas para personalizar: edad aproximada, estilo (casual/elegante/deportivo), ocasión, presupuesto
- Con esa info, recomienda productos específicos de nuestra lista con nombre y precio exacto
- Sé conversacional, usa emojis con moderación, máximo 3 líneas por respuesta
- Si preguntan por stock, precio o tallas, usa los datos exactos de la lista

PRODUCTOS DISPONIBLES EN TIENDA:
${productosContext}

CATEGORÍAS DISPONIBLES:
${categoriasContext}

INFO TIENDA:
- Envío estándar: $9.900 (3-5 días hábiles)
- Envío express: $18.900 (1-2 días hábiles)  
- WhatsApp: +57 3117284178
- Envíos a todo Colombia`

    // Format messages for Groq API
    const messages = [
      { role: 'system', content: systemPrompt }
    ]

    for (const msg of (history || [])) {
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      })
    }

    // Add latest user message
    messages.push({
      role: 'user',
      content: message
    })

    // Call Groq API
    const groqUrl = 'https://api.groq.com/openai/v1/chat/completions'

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(groqUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 500,
        messages: messages
      }),
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const errText = await response.text()
      console.error('Error de Groq API:', errText)
      throw new Error('La API de inteligencia artificial devolvió un error.')
    }

    const resData = await response.json()
    const replyText = resData.choices?.[0]?.message?.content || 'Lo siento, no pude procesar tu solicitud en este momento. ¿Te puedo ayudar con algo más?'

    // Delay response for 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000))

    return NextResponse.json({ reply: replyText })

  } catch (error: any) {
    console.error('Chat API Error:', error)
    return NextResponse.json({ error: error.message || 'Error interno en el servidor.' }, { status: 500 })
  }
}
