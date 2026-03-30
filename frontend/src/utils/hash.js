/**
 * Generate SHA-256 hash from file or text
 */
export const generateHash = async (input) => {
  let data
  
  if (input instanceof File) {
    // Read file as ArrayBuffer
    const buffer = await input.arrayBuffer()
    data = new Uint8Array(buffer)
  } else if (typeof input === 'string') {
    // Convert string to Uint8Array
    const encoder = new TextEncoder()
    data = encoder.encode(input)
  } else {
    throw new Error('Input must be a File or string')
  }

  // Generate SHA-256 hash using Web Crypto API
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex
}

/**
 * Generate hash from form data (for policy registration)
 * Creates deterministic hash from policy details
 */
export const generatePolicyHash = async (policyData) => {
  const { 
    policyNumber, 
    insurerName, 
    holderName, 
    coverageAmount, 
    startDate, 
    endDate 
  } = policyData

  // Create deterministic string from policy data
  const policyString = JSON.stringify({
    policyNumber,
    insurerName,
    holderName,
    coverageAmount,
    startDate,
    endDate,
    timestamp: Date.now(), // Make each registration unique
  })

  return await generateHash(policyString)
}

/**
 * Generate hash from uploaded document
 */
export const generateDocumentHash = async (file) => {
  if (!file) {
    throw new Error('No file provided')
  }
  
  return await generateHash(file)
}

/**
 * Validate hash format (64 character hex string)
 */
export const isValidHash = (hash) => {
  if (!hash || typeof hash !== 'string') return false
  return /^[a-f0-9]{64}$/i.test(hash)
}

/**
 * Format hash for display (first and last 8 characters)
 */
export const formatHash = (hash, chars = 8) => {
  if (!hash) return ''
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`
}

export default {
  generateHash,
  generatePolicyHash,
  generateDocumentHash,
  isValidHash,
  formatHash,
}
