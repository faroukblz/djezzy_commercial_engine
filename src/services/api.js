const HF_MARKETING_URL = import.meta.env.VITE_HF_MARKETING_URL || 'https://faroukblz-djezzy-marketing-engine.hf.space'
const HF_FRAUD_URL = import.meta.env.VITE_HF_FRAUD_URL || 'https://faroukblz-djezzy-fraud-engine.hf.space'
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

/**
 * Call the HF Marketing Engine to predict a segment cluster.
 * @param {number[]} features - Array of 40 numeric features
 */
export async function predictSegment(features) {
  try {
    const res = await fetch(`${HF_MARKETING_URL}/predict_segment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features }),
      signal: AbortSignal.timeout(30000),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { data: null, error: err.detail || `HTTP ${res.status}` }
    }
    const data = await res.json()
    return { data, error: null }
  } catch (e) {
    return { data: null, error: e.name === 'TimeoutError' ? 'HF Space is waking up — please retry in 30s' : e.message }
  }
}

/**
 * Call the HF Fraud Engine to score a transaction.
 * @param {object} transaction - Transaction fields matching the API schema
 */
export async function predictFraud(transaction) {
  try {
    const res = await fetch(`${HF_FRAUD_URL}/predict_fraud`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
      signal: AbortSignal.timeout(30000),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { data: null, error: err.detail || `HTTP ${res.status}` }
    }
    const data = await res.json()
    return { data, error: null }
  } catch (e) {
    return { data: null, error: e.name === 'TimeoutError' ? 'HF Space is waking up — please retry in 30s' : e.message }
  }
}

/**
 * Call the Groq API to generate an SMS message using Llama 3.3.
 * @param {object} params
 * @param {string} params.context - User/transaction context
 * @param {string} params.customInstructions - Custom employee instructions
 * @param {'marketing'|'approve'|'deny'} params.type - SMS type
 */
export async function generateSMS({ context, customInstructions, type }) {
  const systemPrompt = `You are a Djezzy telecom SMS copywriter. You write short, compelling SMS messages (max 160 chars when possible, up to 320 chars if needed).

Rules:
- Write ONLY in informal French (the conversational, everyday French spoken by people).
- DO NOT use Algerian Darija or standard/formal French.
- Be warm, friendly, and professional
- Include relevant details from the user context
- For marketing: promote relevant offers based on the user's data usage and segment
- For refund approval: be empathetic and reassuring, confirm the refund
- For refund denial: be respectful but firm, explain briefly, offer an alternative

Always output ONLY the SMS text, nothing else.`

  let userPrompt = ''
  if (type === 'marketing') {
    userPrompt = `Generate a promotional SMS for this Djezzy customer:\n${context}\n\nCustom instructions from the marketing agent: ${customInstructions || 'None'}`
  } else if (type === 'approve') {
    userPrompt = `Generate a refund APPROVAL SMS for this customer's transaction:\n${context}\n\nCustom instructions from the support agent: ${customInstructions || 'None'}`
  } else if (type === 'deny') {
    userPrompt = `Generate a refund DENIAL SMS for this customer's transaction:\n${context}\n\nCustom instructions from the support agent: ${customInstructions || 'None'}`
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { data: null, error: err.error?.message || `Groq API error: HTTP ${res.status}` }
    }
    const data = await res.json()
    const sms = data.choices?.[0]?.message?.content?.trim() || ''
    return { data: sms, error: null }
  } catch (e) {
    return { data: null, error: e.message }
  }
}
