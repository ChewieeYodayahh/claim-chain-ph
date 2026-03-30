import * as StellarSdk from '@stellar/stellar-sdk'

// Configuration from environment
const CONFIG = {
  contractId: import.meta.env.VITE_CONTRACT_ID,
  network: import.meta.env.VITE_NETWORK || 'testnet',
  networkPassphrase: import.meta.env.VITE_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
  horizonUrl: import.meta.env.VITE_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  sorobanRpcUrl: import.meta.env.VITE_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org',
  adminAddress: import.meta.env.VITE_ADMIN_ADDRESS,
}

// Initialize Soroban RPC server
export const server = new StellarSdk.SorobanRpc.Server(CONFIG.sorobanRpcUrl)

// Initialize Horizon server (for XLM transfers)
export const horizonServer = new StellarSdk.Horizon.Server(CONFIG.horizonUrl)

// Get network passphrase
export const getNetworkPassphrase = () => {
  return CONFIG.networkPassphrase
}

// Get contract ID
export const getContractId = () => {
  return CONFIG.contractId
}

// Get admin address
export const getAdminAddress = () => {
  return CONFIG.adminAddress
}

// Check if address is admin
export const isAdmin = (address) => {
  return address === CONFIG.adminAddress
}

// Format Stellar address for display
export const formatAddress = (address, chars = 4) => {
  if (!address) return ''
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

// Get account details
export const getAccount = async (publicKey) => {
  try {
    const account = await server.getAccount(publicKey)
    return account
  } catch (error) {
    console.error('Error fetching account:', error)
    throw error
  }
}

// Get XLM balance
export const getXLMBalance = async (publicKey) => {
  try {
    if (!publicKey || !publicKey.startsWith('G')) {
      console.log('Invalid public key for balance check')
      return 0
    }
    const account = await horizonServer.loadAccount(publicKey)
    const xlmBalance = account.balances.find(b => b.asset_type === 'native')
    return xlmBalance ? parseFloat(xlmBalance.balance) : 0
  } catch (error) {
    // Account not found on network (needs funding)
    if (error.response?.status === 404) {
      console.log('Account not found - needs testnet funding')
      return 0
    }
    console.error('Error fetching XLM balance:', error)
    return 0
  }
}

// Fund account on testnet (friendbot)
export const fundTestnetAccount = async (publicKey) => {
  try {
    const response = await fetch(
      `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
    )
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error funding account:', error)
    throw error
  }
}

export default {
  server,
  horizonServer,
  getNetworkPassphrase,
  getContractId,
  getAdminAddress,
  isAdmin,
  formatAddress,
  getAccount,
  getXLMBalance,
  fundTestnetAccount,
  CONFIG,
}
