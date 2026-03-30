import * as StellarSdk from '@stellar/stellar-sdk'
import { signTransaction } from '@stellar/freighter-api'
import { server, getContractId, getNetworkPassphrase } from './stellar'

const CONTRACT_ID = getContractId()
const NETWORK_PASSPHRASE = getNetworkPassphrase()

// Helper to convert public key string to Address ScVal
const addressToScVal = (publicKey) => {
  return StellarSdk.Address.fromString(publicKey).toScVal()
}

// Build a contract call transaction
const buildContractCall = async (publicKey, method, args = []) => {
  const account = await server.getAccount(publicKey)
  const contract = new StellarSdk.Contract(CONTRACT_ID)
  
  const operation = contract.call(method, ...args)
  
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(300)
    .build()

  // Simulate the transaction
  const simulatedTx = await server.simulateTransaction(transaction)
  
  if (StellarSdk.SorobanRpc.Api.isSimulationError(simulatedTx)) {
    throw new Error(`Simulation failed: ${simulatedTx.error}`)
  }

  // Prepare the transaction with the simulation results
  const preparedTx = StellarSdk.SorobanRpc.assembleTransaction(transaction, simulatedTx)
  
  return preparedTx.build()
}

// Sign and submit transaction
const signAndSubmit = async (transaction) => {
  const signedXdr = await signTransaction(transaction.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  })
  
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(
    signedXdr,
    NETWORK_PASSPHRASE
  )
  
  const response = await server.sendTransaction(signedTx)
  
  // Wait for transaction confirmation
  if (response.status === 'PENDING') {
    let getResponse = await server.getTransaction(response.hash)
    while (getResponse.status === 'NOT_FOUND') {
      await new Promise(resolve => setTimeout(resolve, 1000))
      getResponse = await server.getTransaction(response.hash)
    }
    return getResponse
  }
  
  return response
}

// ============================================
// CONTRACT METHODS
// ============================================

/**
 * Register a new insurance policy
 * @param {string} publicKey - Wallet address
 * @param {string} policyHash - SHA256 hash of policy document
 * @param {number} coverageAmount - Coverage in USDC (6 decimals)
 * @param {number} expiryTimestamp - Unix timestamp for expiry
 */
export const registerPolicy = async (publicKey, policyHash, coverageAmount, expiryTimestamp) => {
  try {
    // Validate public key format
    if (!publicKey || !publicKey.startsWith('G')) {
      throw new Error('Invalid wallet address format')
    }

    const args = [
      StellarSdk.nativeToScVal(policyHash, { type: 'string' }),
      addressToScVal(publicKey),
      StellarSdk.nativeToScVal(BigInt(coverageAmount), { type: 'i128' }),
      StellarSdk.nativeToScVal(BigInt(expiryTimestamp), { type: 'u64' }),
    ]
    
    const tx = await buildContractCall(publicKey, 'register_policy', args)
    const result = await signAndSubmit(tx)
    
    return {
      success: true,
      hash: result.hash,
      result: result,
    }
  } catch (error) {
    console.error('Error registering policy:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Pay premium and activate policy
 * @param {string} publicKey - Wallet address
 * @param {string} policyHash - Policy hash to activate
 */
export const payPremium = async (publicKey, policyHash) => {
  try {
    const args = [
      StellarSdk.nativeToScVal(policyHash, { type: 'string' }),
    ]
    
    const tx = await buildContractCall(publicKey, 'pay_premium', args)
    const result = await signAndSubmit(tx)
    
    return {
      success: true,
      hash: result.hash,
      result: result,
    }
  } catch (error) {
    console.error('Error paying premium:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Submit a claim
 * @param {string} publicKey - Wallet address
 * @param {string} policyHash - Policy hash
 * @param {string} documentHash - SHA256 hash of claim documents
 * @param {number} claimAmount - Claim amount in USDC (6 decimals)
 */
export const submitClaim = async (publicKey, policyHash, documentHash, claimAmount) => {
  try {
    const args = [
      StellarSdk.nativeToScVal(policyHash, { type: 'string' }),
      StellarSdk.nativeToScVal(documentHash, { type: 'string' }),
      StellarSdk.nativeToScVal(claimAmount, { type: 'i128' }),
    ]
    
    const tx = await buildContractCall(publicKey, 'submit_claim', args)
    const result = await signAndSubmit(tx)
    
    return {
      success: true,
      hash: result.hash,
      claimId: result.returnValue ? StellarSdk.scValToNative(result.returnValue) : null,
      result: result,
    }
  } catch (error) {
    console.error('Error submitting claim:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Approve a claim (admin only)
 * @param {string} publicKey - Admin wallet address
 * @param {number} claimId - Claim ID to approve
 */
export const approveClaim = async (publicKey, claimId) => {
  try {
    const args = [
      StellarSdk.nativeToScVal(claimId, { type: 'u64' }),
    ]
    
    const tx = await buildContractCall(publicKey, 'approve_claim', args)
    const result = await signAndSubmit(tx)
    
    return {
      success: true,
      hash: result.hash,
      result: result,
    }
  } catch (error) {
    console.error('Error approving claim:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get policy details
 * @param {string} publicKey - Wallet address (for building tx)
 * @param {string} policyHash - Policy hash to query
 */
export const getPolicy = async (publicKey, policyHash) => {
  try {
    const args = [
      StellarSdk.nativeToScVal(policyHash, { type: 'string' }),
    ]
    
    const account = await server.getAccount(publicKey)
    const contract = new StellarSdk.Contract(CONTRACT_ID)
    
    const operation = contract.call('get_policy', ...args)
    
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build()

    const simulatedTx = await server.simulateTransaction(transaction)
    
    if (StellarSdk.SorobanRpc.Api.isSimulationError(simulatedTx)) {
      throw new Error(`Query failed: ${simulatedTx.error}`)
    }

    const returnValue = simulatedTx.result?.retval
    if (returnValue) {
      return StellarSdk.scValToNative(returnValue)
    }
    
    return null
  } catch (error) {
    console.error('Error getting policy:', error)
    return null
  }
}

/**
 * Get claim details
 * @param {string} publicKey - Wallet address
 * @param {number} claimId - Claim ID to query
 */
export const getClaim = async (publicKey, claimId) => {
  try {
    const args = [
      StellarSdk.nativeToScVal(claimId, { type: 'u64' }),
    ]
    
    const account = await server.getAccount(publicKey)
    const contract = new StellarSdk.Contract(CONTRACT_ID)
    
    const operation = contract.call('get_claim', ...args)
    
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build()

    const simulatedTx = await server.simulateTransaction(transaction)
    
    if (StellarSdk.SorobanRpc.Api.isSimulationError(simulatedTx)) {
      throw new Error(`Query failed: ${simulatedTx.error}`)
    }

    const returnValue = simulatedTx.result?.retval
    if (returnValue) {
      return StellarSdk.scValToNative(returnValue)
    }
    
    return null
  } catch (error) {
    console.error('Error getting claim:', error)
    return null
  }
}

/**
 * Verify policy status
 * @param {string} publicKey - Wallet address
 * @param {string} policyHash - Policy hash to verify
 */
export const verifyPolicy = async (publicKey, policyHash) => {
  try {
    const args = [
      StellarSdk.nativeToScVal(policyHash, { type: 'string' }),
    ]
    
    const tx = await buildContractCall(publicKey, 'verify_policy', args)
    const result = await signAndSubmit(tx)
    
    return {
      success: true,
      isActive: result.returnValue ? StellarSdk.scValToNative(result.returnValue) : false,
      result: result,
    }
  } catch (error) {
    console.error('Error verifying policy:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Check expiry alert (within 30 days)
 * @param {string} publicKey - Wallet address
 * @param {string} policyHash - Policy hash to check
 */
export const checkExpiryAlert = async (publicKey, policyHash) => {
  try {
    const args = [
      StellarSdk.nativeToScVal(policyHash, { type: 'string' }),
    ]
    
    const tx = await buildContractCall(publicKey, 'check_expiry_alert', args)
    const result = await signAndSubmit(tx)
    
    return {
      success: true,
      isExpiringSoon: result.returnValue ? StellarSdk.scValToNative(result.returnValue) : false,
      result: result,
    }
  } catch (error) {
    console.error('Error checking expiry:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export default {
  registerPolicy,
  payPremium,
  submitClaim,
  approveClaim,
  getPolicy,
  getClaim,
  verifyPolicy,
  checkExpiryAlert,
}
