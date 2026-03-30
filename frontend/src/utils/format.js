/**
 * Format currency with Philippine Peso symbol
 */
export const formatPHP = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format USDC amount (6 decimals)
 */
export const formatUSDC = (amount) => {
  const value = Number(amount) / 1_000_000
  return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`
}

/**
 * Format XLM amount (7 decimals)
 */
export const formatXLM = (amount) => {
  return `${Number(amount).toFixed(2)} XLM`
}

/**
 * Convert USDC display value to contract format (6 decimals)
 */
export const toUSDCUnits = (displayValue) => {
  return BigInt(Math.floor(Number(displayValue) * 1_000_000))
}

/**
 * Convert contract USDC to display value
 */
export const fromUSDCUnits = (contractValue) => {
  return Number(contractValue) / 1_000_000
}

/**
 * Format date for display
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A'
  const date = new Date(Number(timestamp) * 1000)
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format date with time
 */
export const formatDateTime = (timestamp) => {
  if (!timestamp) return 'N/A'
  const date = new Date(Number(timestamp) * 1000)
  return date.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Convert date to Unix timestamp
 */
export const toUnixTimestamp = (date) => {
  return Math.floor(new Date(date).getTime() / 1000)
}

/**
 * Calculate days until expiry
 */
export const daysUntilExpiry = (expiryTimestamp) => {
  const now = Math.floor(Date.now() / 1000)
  const diff = Number(expiryTimestamp) - now
  return Math.ceil(diff / (24 * 60 * 60))
}

/**
 * Check if policy is expiring soon (within 30 days)
 */
export const isExpiringSoon = (expiryTimestamp) => {
  const days = daysUntilExpiry(expiryTimestamp)
  return days > 0 && days <= 30
}

/**
 * Check if policy has expired
 */
export const isExpired = (expiryTimestamp) => {
  return daysUntilExpiry(expiryTimestamp) <= 0
}

/**
 * Format claim status for display
 */
export const formatClaimStatus = (status) => {
  const statusMap = {
    'Pending': { label: 'Pending', class: 'badge-pending' },
    'Approved': { label: 'Approved', class: 'badge-approved' },
    'Rejected': { label: 'Rejected', class: 'badge-rejected' },
    'Paid': { label: 'Paid', class: 'badge-approved' },
  }
  return statusMap[status] || { label: status, class: 'badge-pending' }
}

/**
 * Truncate text with ellipsis
 */
export const truncate = (text, maxLength = 20) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default {
  formatPHP,
  formatUSDC,
  formatXLM,
  toUSDCUnits,
  fromUSDCUnits,
  formatDate,
  formatDateTime,
  toUnixTimestamp,
  daysUntilExpiry,
  isExpiringSoon,
  isExpired,
  formatClaimStatus,
  truncate,
  formatFileSize,
}
