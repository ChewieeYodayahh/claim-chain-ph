import { useState } from 'react'
import { submitClaim, getPolicy } from '../services/contract'
import { generateDocumentHash, formatHash } from '../utils/hash'
import { toUSDCUnits, formatUSDC, formatDate, fromUSDCUnits } from '../utils/format'

function ClaimSubmit({ walletAddress }) {
  const [formData, setFormData] = useState({
    policyHash: '',
    claimAmount: '',
    description: '',
  })
  const [documentFile, setDocumentFile] = useState(null)
  const [documentHash, setDocumentHash] = useState(null)
  const [policy, setPolicy] = useState(null)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState(null)
  const [step, setStep] = useState(1)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setDocumentFile(file)
    
    try {
      const hash = await generateDocumentHash(file)
      setDocumentHash(hash)
    } catch (error) {
      setResult({ success: false, error: 'Failed to hash document: ' + error.message })
    }
  }

  const verifyPolicy = async () => {
    if (!formData.policyHash.trim()) {
      setResult({ success: false, error: 'Please enter your policy hash' })
      return
    }

    setVerifying(true)
    setResult(null)

    try {
      const policyData = await getPolicy(walletAddress, formData.policyHash.trim())
      
      if (policyData) {
        if (!policyData.active || !policyData.premium_paid) {
          setResult({ success: false, error: 'Policy is not active. Please pay premium first.' })
          return
        }
        setPolicy(policyData)
        setStep(2)
      } else {
        setResult({ success: false, error: 'Policy not found. Please check the hash.' })
      }
    } catch (error) {
      setResult({ success: false, error: error.message || 'Failed to verify policy' })
    } finally {
      setVerifying(false)
    }
  }

  const handleSubmit = async () => {
    if (!documentHash) {
      setResult({ success: false, error: 'Please upload a supporting document' })
      return
    }

    if (!formData.claimAmount || parseFloat(formData.claimAmount) <= 0) {
      setResult({ success: false, error: 'Please enter a valid claim amount' })
      return
    }

    const claimAmountUSDC = toUSDCUnits(formData.claimAmount)
    if (claimAmountUSDC > policy.coverage_amount) {
      setResult({ 
        success: false, 
        error: `Claim amount exceeds coverage (${formatUSDC(policy.coverage_amount)})` 
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await submitClaim(
        walletAddress,
        formData.policyHash.trim(),
        documentHash,
        claimAmountUSDC
      )

      if (response.success) {
        setResult({
          success: true,
          message: 'Claim submitted successfully!',
          claimId: response.claimId,
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
    setFormData({ policyHash: '', claimAmount: '', description: '' })
    setDocumentFile(null)
    setDocumentHash(null)
    setPolicy(null)
    setResult(null)
    setStep(1)
  }

  return (
    <div className="max-w-2xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">📝 Submit Claim</h1>
        <p className="text-gray-400">
          File a claim with document verification for instant processing
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step >= s 
                ? 'bg-claimchain-accent text-black' 
                : 'bg-gray-700 text-gray-400'
            }`}>
              {s === 3 && step === 3 ? '✓' : s}
            </div>
            {s < 3 && (
              <div className={`w-16 h-1 ${step > s ? 'bg-claimchain-accent' : 'bg-gray-700'}`}></div>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">Step 1: Verify Your Policy</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Policy Hash
              </label>
              <input
                type="text"
                name="policyHash"
                value={formData.policyHash}
                onChange={handleChange}
                placeholder="Enter your policy hash"
                className="input-field font-mono"
              />
            </div>

            {result && !result.success && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{result.error}</p>
              </div>
            )}

            <button
              onClick={verifyPolicy}
              disabled={verifying || !formData.policyHash.trim()}
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
            <h2 className="text-xl font-semibold text-white mb-6">Step 2: Submit Claim Details</h2>
            
            {/* Policy Summary */}
            <div className="bg-stellar-dark rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-500">Policy Status</span>
                <span className="badge-active">Active ✓</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Max Coverage</span>
                <span className="text-claimchain-secondary font-semibold">
                  {formatUSDC(policy.coverage_amount)}
                </span>
              </div>
            </div>

            {/* Claim Form */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Claim Amount (USDC) *
                </label>
                <input
                  type="number"
                  name="claimAmount"
                  value={formData.claimAmount}
                  onChange={handleChange}
                  placeholder="e.g., 5000"
                  className="input-field"
                  max={fromUSDCUnits(policy.coverage_amount)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: {formatUSDC(policy.coverage_amount)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Supporting Document (Hospital Bill, Receipt, etc.) *
                </label>
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-claimchain-accent transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="document-upload"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <label htmlFor="document-upload" className="cursor-pointer">
                    {documentFile ? (
                      <div>
                        <span className="text-4xl mb-2 block">📄</span>
                        <p className="text-white font-medium">{documentFile.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(documentFile.size / 1024).toFixed(2)} KB
                        </p>
                        {documentHash && (
                          <p className="text-xs text-claimchain-primary mt-2 font-mono">
                            Hash: {formatHash(documentHash)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span className="text-4xl mb-2 block">📤</span>
                        <p className="text-gray-400">Click to upload document</p>
                        <p className="text-xs text-gray-500 mt-1">
                          PDF, JPG, PNG, DOC supported
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief description of the claim..."
                  className="input-field h-24 resize-none"
                />
              </div>
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
                onClick={handleSubmit}
                disabled={loading || !documentHash || !formData.claimAmount}
                className="flex-1 btn-accent disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="spinner w-5 h-5 mr-2"></div>
                    Submitting...
                  </span>
                ) : (
                  'Submit Claim →'
                )}
              </button>
            </div>
          </div>
        )}

        {step === 3 && result?.success && (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
              <span className="text-5xl">🎯</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Claim Submitted!</h2>
            <p className="text-gray-400 mb-6">{result.message}</p>

            <div className="bg-stellar-dark rounded-lg p-4 mb-6 text-left">
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Claim ID</p>
                <p className="text-2xl font-bold text-claimchain-accent">#{result.claimId}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Document Hash</p>
                <p className="font-mono text-claimchain-primary text-sm break-all">{documentHash}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Transaction Hash</p>
                <p className="font-mono text-gray-400 text-xs break-all">{result.hash}</p>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="text-yellow-400 text-sm">
                ⏳ Your claim is pending admin approval. Once approved, you'll receive instant USDC payout!
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={resetForm}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg transition-colors"
              >
                Submit Another
              </button>
              <a
                href="/"
                className="flex-1 btn-primary text-center"
              >
                View Dashboard
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClaimSubmit
