import { useState } from 'react'
import { isConnected, getPublicKey, requestAccess, isAllowed, setAllowed } from '@stellar/freighter-api'

function WalletConnect({ onConnect }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const connectWallet = async () => {
    setLoading(true)
    setError(null)

    try {
      // Check if Freighter is installed
      const connected = await isConnected()
      
      if (!connected) {
        setError('Freighter wallet not detected. Please install the extension.')
        setLoading(false)
        return
      }

      // Check if already allowed
      const allowed = await isAllowed()
      
      if (!allowed) {
        // Request access
        await setAllowed()
      }

      // Get the public key
      const result = await getPublicKey()
      const publicKey = typeof result === 'object' ? result.publicKey : result
      
      if (publicKey && publicKey.startsWith('G')) {
        onConnect(publicKey)
      } else {
        throw new Error('Please unlock Freighter and allow access')
      }
    } catch (err) {
      console.error('Wallet connection error:', err)
      setError(err.message || 'Failed to connect wallet. Make sure Freighter is unlocked.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-claimchain-primary to-claimchain-secondary rounded-2xl flex items-center justify-center pulse-glow">
            <span className="text-5xl">⛓️</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            ClaimChain <span className="text-claimchain-accent">PH</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Instant insurance claims powered by Stellar blockchain
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="card text-center p-4">
            <span className="text-3xl mb-2 block">⚡</span>
            <h3 className="font-semibold text-white mb-1">Instant Claims</h3>
            <p className="text-xs text-gray-500">No more 2-3 week delays</p>
          </div>
          <div className="card text-center p-4">
            <span className="text-3xl mb-2 block">🔐</span>
            <h3 className="font-semibold text-white mb-1">On-Chain Proof</h3>
            <p className="text-xs text-gray-500">Immutable records</p>
          </div>
          <div className="card text-center p-4">
            <span className="text-3xl mb-2 block">💰</span>
            <h3 className="font-semibold text-white mb-1">USDC Payouts</h3>
            <p className="text-xs text-gray-500">Instant to your wallet</p>
          </div>
          <div className="card text-center p-4">
            <span className="text-3xl mb-2 block">🚫</span>
            <h3 className="font-semibold text-white mb-1">No Agent Needed</h3>
            <p className="text-xs text-gray-500">Self-service claims</p>
          </div>
        </div>

        {/* Connect Button */}
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4 text-center">
            Connect Your Wallet
          </h2>
          
          <button
            onClick={connectWallet}
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="spinner w-5 h-5"></div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <img 
                  src="https://freighter.stellar.org/favicon.ico" 
                  alt="Freighter" 
                  className="w-5 h-5"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
                <span>Connect with Freighter</span>
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <p className="text-gray-500 text-xs text-center mt-4">
            Don't have Freighter?{' '}
            <a 
              href="https://www.freighter.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-claimchain-primary hover:underline"
            >
              Download here
            </a>
          </p>
        </div>

        {/* Network Badge */}
        <div className="text-center mt-6">
          <span className="inline-flex items-center space-x-2 bg-yellow-500/10 text-yellow-400 px-4 py-2 rounded-full text-sm">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
            <span>Stellar Testnet</span>
          </span>
        </div>
      </div>
    </div>
  )
}

export default WalletConnect
