import { useState } from 'react'
import { payPremium, getPolicy } from '../services/contract'
import { formatHash } from '../utils/hash'
import { formatUSDC, fromUSDCUnits, formatDate } from '../utils/format'

function PremiumPayment({ walletAddress }) {
  const [policyHash, setPolicyHash] = useState('')
  const [policy, setPolicy] = useState(null)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState(null)
  const [step, setStep] = useState(1)

  const verifyPolicy = async () => {
    if (!policyHash.trim()) {
      setResult({ success: false, error: 'Please enter a policy hash' })
      return
    }

    setVerifying(true)
    setResult(null)

    try {
      const policyData = await getPolicy(walletAddress, policyHash.trim())
      
      if (policyData) {
        setPolicy(policyData)
        setStep(2)
      } else {
        setResult({ success: false, error: 'Policy not found. Please check the hash.' })
      }
    } catch (error) {
      setResult({ success: false, error: error.message || 'Failed to fetch policy' })
    } finally {
      setVerifying(false)
    }
  }

  const handlePayPremium = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await payPremium(walletAddress, policyHash.trim())

      if (response.success) {
        setResult({
          success: true,
          message: 'Premium paid! Your policy is now ACTIVE.',
          hash: response.hash,
        })
        setStep(3)
      } else {
        setResult({ success: false, error: response.error })
      }
    } catch (error) {
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setPolicyHash('')
    setPolicy(null)
    setResult(null)
    setStep(1)
  }

  return (
    <div className="max-w-2xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">💳 Pay Premium</h1>
        <p className="text-gray-400">
          Activate your policy by paying the premium
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step >= s 
                ? 'bg-claimchain-secondary text-white' 
                : 'bg-gray-700 text-gray-400'
            }`}>
              {s === 3 && step === 3 ? '✓' : s}
            </div>
            {s < 3 && (
              <div className={`w-16 h-1 ${step > s ? 'bg-claimchain-secondary' : 'bg-gray-700'}`}></div>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">Step 1: Enter Policy Hash</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Policy Hash
              </label>
              <input
                type="text"
                value={policyHash}
                onChange={(e) => setPolicyHash(e.target.value)}
                placeholder="Enter your policy hash (e.g., a1b2c3d4...)"
                className="input-field font-mono"
              />
              <p className="text-xs text-gray-500 mt-2">
                You received this hash when you registered your policy
              </p>
            </div>

            {result && !result.success && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{result.error}</p>
              </div>
            )}

            <button
              onClick={verifyPolicy}
              disabled={verifying || !policyHash.trim()}
              className="w-full btn-primary disabled:opacity-50"
            >
              {verifying ? (
                <span className="flex items-center justify-center">
                  <div className="spinner w-5 h-5 mr-2"></div>
                  Verifying...
                </span>
              ) : (
                'Verify Policy →'
              )}
            </button>
          </div>
        )}

        {step === 2 && policy && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">Step 2: Confirm & Pay</h2>
            
            <div className="bg-stellar-dark rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-500">Policy Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  policy.active 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {policy.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Policy Hash</span>
                  <span className="font-mono text-claimchain-primary text-sm">
                    {formatHash(policyHash)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Coverage</span>
                  <span className="text-claimchain-secondary font-semibold">
                    {formatUSDC(policy.coverage_amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Expiry Date</span>
                  <span className="text-white">{formatDate(policy.expiry_timestamp)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Premium Paid</span>
                  <span className={policy.premium_paid ? 'text-green-400' : 'text-red-400'}>
                    {policy.premium_paid ? 'Yes ✓' : 'No ✗'}
                  </span>
                </div>
              </div>
            </div>

            {policy.premium_paid ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                <p className="text-green-400 text-sm">
                  ✅ Premium already paid! Your policy is active.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                  <p className="text-blue-400 text-sm">
                    💡 Paying the premium will activate your policy and make it eligible for claims.
                  </p>
                </div>

                {result && !result.success && (
                  <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-sm">{result.error}</p>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handlePayPremium}
                    disabled={loading}
                    className="flex-1 btn-secondary disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <div className="spinner w-5 h-5 mr-2"></div>
                        Processing...
                      </span>
                    ) : (
                      'Pay Premium & Activate ✓'
                    )}
                  </button>
                </div>
              </>
            )}

            {policy.premium_paid && (
              <div className="flex space-x-4">
                <button
                  onClick={resetForm}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg transition-colors"
                >
                  Check Another
                </button>
                <a
                  href="/claim"
                  className="flex-1 btn-accent text-center"
                >
                  Submit Claim →
                </a>
              </div>
            )}
          </div>
        )}

        {step === 3 && result?.success && (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
              <span className="text-5xl">🎉</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Policy Activated!</h2>
            <p className="text-gray-400 mb-6">{result.message}</p>

            <div className="bg-stellar-dark rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-500 mb-1">Transaction Hash</p>
              <p className="font-mono text-gray-400 text-xs break-all">{result.hash}</p>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
              <p className="text-green-400 text-sm">
                ✅ Your policy is now active! You can submit claims when needed.
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={resetForm}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg transition-colors"
              >
                Pay Another
              </button>
              <a
                href="/claim"
                className="flex-1 btn-accent text-center"
              >
                Submit Claim →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PremiumPayment
