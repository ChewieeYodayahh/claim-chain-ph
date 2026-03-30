import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import WalletConnect from './components/WalletConnect'
import Dashboard from './components/Dashboard'
import PolicyRegister from './components/PolicyRegister'
import PremiumPayment from './components/PremiumPayment'
import ClaimSubmit from './components/ClaimSubmit'
import AdminPanel from './components/AdminPanel'
import { isConnected, getPublicKey } from '@stellar/freighter-api'

function App() {
  const [walletAddress, setWalletAddress] = useState(null)
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkWalletConnection()
  }, [])

  const checkWalletConnection = async () => {
    try {
      const connected = await isConnected()
      if (connected) {
        const publicKey = await getPublicKey()
        setWalletAddress(publicKey)
        setIsWalletConnected(true)
      }
    } catch (error) {
      console.log('Wallet not connected:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWalletConnect = (address) => {
    setWalletAddress(address)
    setIsWalletConnected(true)
  }

  const handleDisconnect = () => {
    setWalletAddress(null)
    setIsWalletConnected(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-400">Loading ClaimChain PH...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar 
        walletAddress={walletAddress} 
        isConnected={isWalletConnected}
        onDisconnect={handleDisconnect}
      />
      
      <main className="container mx-auto px-4 py-8">
        {!isWalletConnected ? (
          <WalletConnect onConnect={handleWalletConnect} />
        ) : (
          <Routes>
            <Route path="/" element={<Dashboard walletAddress={walletAddress} />} />
            <Route path="/register" element={<PolicyRegister walletAddress={walletAddress} />} />
            <Route path="/premium" element={<PremiumPayment walletAddress={walletAddress} />} />
            <Route path="/claim" element={<ClaimSubmit walletAddress={walletAddress} />} />
            <Route path="/admin" element={<AdminPanel walletAddress={walletAddress} />} />
          </Routes>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>ClaimChain PH © 2026 - Powered by Stellar Blockchain</p>
          <p className="text-sm mt-2">
            Contract: <span className="text-claimchain-primary font-mono text-xs">
              {import.meta.env.VITE_CONTRACT_ID?.slice(0, 8)}...{import.meta.env.VITE_CONTRACT_ID?.slice(-8)}
            </span>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
