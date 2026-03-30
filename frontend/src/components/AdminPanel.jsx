import { useState } from 'react'
import { approveClaim, getClaim } from '../services/contract'
import { isAdmin } from '../services/stellar'
import { formatUSDC, formatDateTime, formatClaimStatus } from '../utils/format'
import { formatHash } from '../utils/hash'

function AdminPanel({ walletAddress }) {
  const [claimId, setClaimId] = useState('')
  const [claim, setClaim] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [result, setResult] = useState(null)

  const adminAccess = isAdmin(walletAddress)

  const fetchClaim = async () => {
    if (!claimId.trim()) {
      setResult({ success: false, error: 'Please enter a claim ID' })
      return
    }

    setFetching(true)
    setResult(null)
    setClaim(null)

    try {
      const claimData = await getClaim(walletAddress, parseInt(claimId))
      
      if (claimData) {
        setClaim(claimData)
      } else {
        setResult({ success: false, error: 'Claim not found' })
      }
    } catch (error) {
      setResult({ success: false, error: error.message || 'Failed to fetch claim' })
    } finally {
      setFetching(false)
    }
  }

  const handleApprove = async () => {
    if (!adminAccess) {
      setResult({ success: false, error: 'Admin access required' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await approveClaim(walletAddress, parseInt(claimId))

      if (response.success) {
        setResult({
          success: true,
          message: `Claim #${claimId} approved! USDC payout initiated.`,
          hash: response.hash,
        })
        // Refresh claim data
        const updatedClaim = await getClaim(walletAddress, parseInt(claimId))
        if (updatedClaim) setClaim(updatedClaim)
      } else {
        setResult({ success: false, error: response.error })
      }
    } catch (error) {
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  if (!adminAccess) {
    return (
      <div className="max-w-2xl mx-auto fade-in">
        <div className="card text-center py-12">
          <span className="text-6xl mb-4 block">🔒</span>
          <h2 className="text-2xl font-bold text-white mb-2">Admin Access Required</h2>
          <p className="text-gray-400 mb-6">
            This panel is restricted to authorized administrators.
          </p>
          <div className="bg-stellar-dark rounded-lg p-4 text-left">
            <p className="text-sm text-gray-500 mb-2">Your wallet:</p>
            <p className="font-mono text-gray-400 text-sm break-all">{walletAddress}</p>
          </div>
          <p className="text-xs text-gray-600 mt-4">
            Contact support if you believe you should have admin access.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto fade-in">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <h1 className="text-3xl font-bold text-white">⚙️ Admin Panel</h1>
          <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm">
            👑 Admin
          </span>
        </div>
        <p className="text-gray-400">
          Review and approve insurance claims
        </p>
      </div>

      {/* Search Claim */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Search Claim</h2>
        <div className="flex space-x-4">
          <input
            type="number"
            value={claimId}
            onChange={(e) => setClaimId(e.target.value)}
            placeholder="Enter Claim ID (e.g., 1)"
            className="input-field flex-1"
            min="1"
          />
          <button
            onClick={fetchClaim}
            disabled={fetching || !claimId.trim()}
            className="btn-primary disabled:opacity-50"
          >
            {fetching ? (
              <span className="flex items-center">
                <div className="spinner w-5 h-5 mr-2"></div>
                Fetching...
              </span>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {result && !result.success && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{result.error}</p>
        </div>
      )}

      {/* Success Message */}
      {result && result.success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-green-400 text-sm mb-2">{result.message}</p>
          {result.hash && (
            <p className="text-xs text-gray-500">
              Transaction: <span className="font-mono">{formatHash(result.hash, 12)}</span>
            </p>
          )}
        </div>
      )}

      {/* Claim Details */}
      {claim && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              Claim #{claim.claim_id}
            </h2>
            <span className={formatClaimStatus(claim.status?.toString() || 'Pending').class}>
              {claim.status?.toString() || 'Pending'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-stellar-dark rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Claimant</p>
              <p className="font-mono text-claimchain-primary text-sm break-all">
                {claim.claimant}
              </p>
            </div>

            <div className="bg-stellar-dark rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Claim Amount</p>
              <p className="text-2xl font-bold text-claimchain-secondary">
                {formatUSDC(claim.claim_amount)}
              </p>
            </div>

            <div className="bg-stellar-dark rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Policy Hash</p>
              <p className="font-mono text-gray-400 text-sm break-all">
                {claim.policy_hash}
              </p>
            </div>

            <div className="bg-stellar-dark rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Document Hash</p>
              <p className="font-mono text-gray-400 text-sm break-all">
                {claim.document_hash}
              </p>
            </div>

            <div className="bg-stellar-dark rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Submitted At</p>
              <p className="text-white">
                {formatDateTime(claim.submitted_at)}
              </p>
            </div>

            <div className="bg-stellar-dark rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <p className="text-white capitalize">
                {claim.status?.toString() || 'Pending'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {claim.status?.toString() === 'Pending' && (
            <div className="border-t border-gray-700 pt-6">
              <h3 className="font-semibold text-white mb-4">Actions</h3>
              <div className="flex space-x-4">
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="flex-1 btn-secondary disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className="spinner w-5 h-5 mr-2"></div>
                      Approving...
                    </span>
                  ) : (
                    '✓ Approve & Pay Out'
                  )}
                </button>
                <button
                  disabled
                  className="flex-1 bg-red-500/20 text-red-400 py-3 px-6 rounded-lg opacity-50 cursor-not-allowed"
                >
                  ✗ Reject (Coming Soon)
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Approving will initiate instant USDC payout to the claimant's wallet.
              </p>
            </div>
          )}

          {claim.status?.toString() === 'Approved' && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-400">
                ✅ This claim has been approved. USDC payout has been initiated.
              </p>
            </div>
          )}

          {claim.status?.toString() === 'Paid' && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-400">
                💰 This claim has been paid out to the claimant.
              </p>
            </div>
          )}

          {claim.status?.toString() === 'Rejected' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400">
                ❌ This claim has been rejected.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {!claim && (
        <div className="card bg-blue-500/10 border-blue-500/30">
          <h3 className="font-semibold text-blue-400 mb-3">📋 Admin Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-400 text-sm">
            <li>Enter a Claim ID to search for pending claims</li>
            <li>Review the claim details and document hash</li>
            <li>Verify the document hash matches the uploaded document</li>
            <li>Click "Approve & Pay Out" to initiate USDC transfer</li>
            <li>The claimant receives instant payout to their wallet</li>
          </ol>
        </div>
      )}
    </div>
  )
}

export default AdminPanel
