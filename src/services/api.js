const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

/**
 * Call the Backend to predict a segment cluster.
 * @param {number[][]} features - Array of feature arrays (for batching)
 */
export async function predictSegment(features) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/marketing/segment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features }),
      signal: AbortSignal.timeout(60000),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { data: null, error: err.detail || `HTTP ${res.status}` }
    }
    const data = await res.json()
    return { data, error: null }
  } catch (e) {
    return { data: null, error: e.name === 'TimeoutError' ? 'Backend is waking up — please retry in 30s' : e.message }
  }
}

/**
 * Call the Backend to score a transaction for fraud.
 * @param {object} transaction - Transaction fields
 */
export async function predictFraud(transaction) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/support/score-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
      signal: AbortSignal.timeout(60000),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { data: null, error: err.detail || `HTTP ${res.status}` }
    }
    const data = await res.json()
    return { data, error: null }
  } catch (e) {
    return { data: null, error: e.name === 'TimeoutError' ? 'Backend is waking up — please retry in 30s' : e.message }
  }
}

/**
 * Call the Backend to generate an SMS message.
 * @param {object} params
 * @param {string} params.context - User/transaction context
 * @param {string} params.customInstructions - Custom employee instructions
 * @param {'marketing'|'approve'|'deny'} params.type - SMS type
 */
export async function generateSMS({ context, customInstructions, type }) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/llm/generate-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context, customInstructions, type }),
      signal: AbortSignal.timeout(60000),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { data: null, error: err.detail || `HTTP ${res.status}` }
    }
    const data = await res.json()
    return { data: data.sms, error: null }
  } catch (e) {
    return { data: null, error: e.message }
  }
}
