import { useState } from 'react'
import { registerPolicy } from '../services/contract'
import { generatePolicyHash } from '../utils/hash'
import { toUnixTimestamp, formatUSDC, toUSDCUnits } from '../utils/format'
import { formatHash } from '../utils/hash'

function PolicyRegister({ walletAddress }) {
  const [formData, setFormData] = useState({
    policyNumber: '',
    insurerName: '',
    holderName: '',
    coverageAmount: '',
    startDate: '',
    endDate: '',
  })
  const [generatedHash, setGeneratedHash] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [step, setStep] = useState(1)

  const insurers = [
    'Sun Life Philippines',
    'Pru Life UK',
    'Manulife Philippines',
    'AXA Philippines',
    'Insular Life',
    'Other',
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const generateHash = async () => {
    if (!formData.policyNumber || !formData.insurerName || !formData.coverageAmount || !formData.endDate) {
      setResult({ success: false, error: 'Please fill in all required fields' })
      return
    }

    setLoading(true)
    try {
      const hash = await generatePolicyHash(formData)
      setGeneratedHash(hash)
      setStep(2)
      setResult(null)
    } catch (error) {
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!generatedHash) {
      setResult({ success: false, error: 'Please generate policy hash first' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const coverageInUSDC = toUSDCUnits(formData.coverageAmount)
      const expiryTimestamp = toUnixTimestamp(formData.endDate)

      const response = await registerPolicy(
        walletAddress,
        generatedHash,
        coverageInUSDC,
        expiryTimestamp
      )

      if (response.success) {
        setResult({
          success: true,
          message: 'Policy registered successfully on Stellar!',
          hash: response.hash,
          policyHash: generatedHash,
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
    setFormData({
      policyNumber: '',
      insurerName: '',
      holderName: '',
      coverageAmount: '',
      startDate: '',
      endDate: '',
    })
    setGeneratedHash(null)
    setResult(null)
    setStep(1)
  }

  return (
    <div className="max-w-2xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">📋 Register Policy</h1>
        <p className="text-gray-400">
          Register your insurance policy on-chain for transparent tracking
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step >= s 
                ? 'bg-claimchain-primary text-white' 
                : 'bg-gray-700 text-gray-400'
            }`}>
              {s === 3 && step === 3 ? '✓' : s}
            </div>
            {s < 3 && (
              <div className={`w-16 h-1 ${step > s ? 'bg-claimchain-primary' : 'bg-gray-700'}`}></div>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); generateHash(); }}>
            <h2 className="text-xl font-semibold text-white mb-6">Step 1: Enter Policy Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Policy Number *
                </label>
                <input
                  type="text"
                  name="policyNumber"
                  value={formData.policyNumber}
                  onChange={handleChange}
                  placeholder="e.g., POL-2026-001234"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Insurance Provider *
                </label>
                <select
                  name="insurerName"
                  value={formData.insurerName}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="">Select provider</option>
                  {insurers.map(insurer => (
                    <option key={insurer} value={insurer}>{insurer}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Policy Holder Name
                </label>
                <input
                  type="text"
                  name="holderName"
                  value={formData.holderName}
                  onChange={handleChange}
                  placeholder="Full legal name"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Coverage Amount (USDC) *
                </label>
                <input
                  type="number"
                  name="coverageAmount"
                  value={formData.coverageAmount}
                  onChange={handleChange}
                  placeholder="e.g., 50000"
                  className="input-field"
                  min="1"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter coverage in USDC (1 USDC ≈ ₱56)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
              </div>
            </div>

            {result && !result.success && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{result.error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary mt-6 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="spinner w-5 h-5 mr-2"></div>
                  Generating Hash...
                </span>
              ) : (
                'Generate Policy Hash →'
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">Step 2: Confirm & Register</h2>
            
            <div className="bg-stellar-dark rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-2">Generated Policy Hash</p>
              <p className="font-mono text-claimchain-primary break-all">{generatedHash}</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500">Policy Number</span>
                <span className="text-white">{formData.policyNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Insurer</span>
                <span className="text-white">{formData.insurerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Coverage</span>
                <span className="text-claimchain-secondary">{formatUSDC(toUSDCUnits(formData.coverageAmount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Expiry</span>
                <span className="text-white">{formData.endDate}</span>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="text-yellow-400 text-sm">
                ⚠️ This will register your policy on Stellar blockchain. 
                Please confirm the details are correct.
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
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="spinner w-5 h-5 mr-2"></div>
                    Registering...
                  </span>
                ) : (
                  'Register on Stellar ✓'
                )}
              </button>
            </div>
          </div>
        )}

        {step === 3 && result?.success && (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
              <span className="text-5xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Policy Registered!</h2>
            <p className="text-gray-400 mb-6">{result.message}</p>

            <div className="bg-stellar-dark rounded-lg p-4 mb-6 text-left">
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Policy Hash (Save this!)</p>
                <p className="font-mono text-claimchain-primary text-sm break-all">{result.policyHash}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Transaction Hash</p>
                <p className="font-mono text-gray-400 text-xs break-all">{result.hash}</p>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <p className="text-blue-400 text-sm">
                💡 <strong>Next step:</strong> Pay your premium to activate the policy
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={resetForm}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg transition-colors"
              >
                Register Another
              </button>
              <a
                href="/premium"
                className="flex-1 btn-secondary text-center"
              >
                Pay Premium →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PolicyRegister
