import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getXLMBalance, formatAddress, isAdmin } from '../services/stellar'
import { formatXLM, formatUSDC, formatDate, daysUntilExpiry, isExpiringSoon } from '../utils/format'

function Dashboard({ walletAddress }) {
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [policies, setPolicies] = useState([])
  const [claims, setClaims] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [walletAddress])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Fetch XLM balance
      const xlmBalance = await getXLMBalance(walletAddress)
      setBalance(xlmBalance)

      // TODO: Fetch policies and claims from contract
      // For now, using demo data
      setPolicies([])
      setClaims([])
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const adminAccess = isAdmin(walletAddress)

  return (
    <div className="fade-in">
      {/* Welcome Banner */}
      <div className="card mb-8 bg-gradient-to-r from-claimchain-primary/20 to-claimchain-secondary/20 border-claimchain-primary/30">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Welcome to ClaimChain PH 👋
            </h1>
            <p className="text-gray-400">
              Manage your insurance policies and claims on Stellar
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="bg-stellar-dark px-6 py-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Your Wallet</p>
              <p className="font-mono text-claimchain-primary">
                {formatAddress(walletAddress, 8)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">XLM Balance</span>
            <span className="text-2xl">💎</span>
          </div>
          {loading ? (
            <div className="h-8 bg-gray-700 rounded animate-pulse"></div>
          ) : (
            <p className="text-2xl font-bold text-white">{formatXLM(balance)}</p>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Active Policies</span>
            <span className="text-2xl">📋</span>
          </div>
          <p className="text-2xl font-bold text-claimchain-secondary">{policies.length}</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Pending Claims</span>
            <span className="text-2xl">⏳</span>
          </div>
          <p className="text-2xl font-bold text-claimchain-accent">
            {claims.filter(c => c.status === 'Pending').length}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Total Claimed</span>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatUSDC(claims.filter(c => c.status === 'Paid').reduce((sum, c) => sum + c.amount, 0) * 1_000_000)}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/register" className="card hover:border-claimchain-primary/50 transition-all group">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-claimchain-primary/20 rounded-xl flex items-center justify-center group-hover:bg-claimchain-primary/30 transition-colors">
              <span className="text-3xl">📋</span>
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-claimchain-primary transition-colors">
                Register Policy
              </h3>
              <p className="text-sm text-gray-500">Add new insurance policy</p>
            </div>
          </div>
        </Link>

        <Link to="/premium" className="card hover:border-claimchain-secondary/50 transition-all group">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-claimchain-secondary/20 rounded-xl flex items-center justify-center group-hover:bg-claimchain-secondary/30 transition-colors">
              <span className="text-3xl">💳</span>
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-claimchain-secondary transition-colors">
                Pay Premium
              </h3>
              <p className="text-sm text-gray-500">Activate your policy</p>
            </div>
          </div>
        </Link>

        <Link to="/claim" className="card hover:border-claimchain-accent/50 transition-all group">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-claimchain-accent/20 rounded-xl flex items-center justify-center group-hover:bg-claimchain-accent/30 transition-colors">
              <span className="text-3xl">📝</span>
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-claimchain-accent transition-colors">
                Submit Claim
              </h3>
              <p className="text-sm text-gray-500">File insurance claim</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Admin Badge */}
      {adminAccess && (
        <div className="card bg-purple-500/10 border-purple-500/30 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">👑</span>
              <div>
                <h3 className="font-semibold text-purple-400">Admin Access</h3>
                <p className="text-sm text-gray-500">You can approve/reject claims</p>
              </div>
            </div>
            <Link to="/admin" className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Go to Admin Panel
            </Link>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-6">Recent Activity</h2>
        
        {policies.length === 0 && claims.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">📭</span>
            <h3 className="text-xl font-semibold text-white mb-2">No Activity Yet</h3>
            <p className="text-gray-500 mb-6">
              Start by registering your first insurance policy
            </p>
            <Link to="/register" className="btn-primary inline-block">
              Register Policy
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Activity items would go here */}
            <p className="text-gray-500 text-center py-4">
              Your recent policies and claims will appear here
            </p>
          </div>
        )}
      </div>

      {/* Demo Instructions */}
      <div className="card mt-8 bg-blue-500/10 border-blue-500/30">
        <h3 className="font-semibold text-blue-400 mb-3">🎯 Demo Flow (Under 2 Minutes)</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-400 text-sm">
          <li>Click <strong className="text-white">"Register Policy"</strong> → Enter your policy details</li>
          <li>Click <strong className="text-white">"Pay Premium"</strong> → Enter policy hash → Activate</li>
          <li>Click <strong className="text-white">"Submit Claim"</strong> → Upload hospital bill → Submit</li>
          <li>Admin approves → <strong className="text-green-400">Instant USDC payout!</strong></li>
        </ol>
      </div>
    </div>
  )
}

export default Dashboard
