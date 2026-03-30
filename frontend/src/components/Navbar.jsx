import { Link, useLocation } from 'react-router-dom'
import { formatAddress } from '../services/stellar'

function Navbar({ walletAddress, isConnected, onDisconnect }) {
  const location = useLocation()
  
  const navLinks = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/register', label: 'Register Policy', icon: '📋' },
    { path: '/premium', label: 'Pay Premium', icon: '💳' },
    { path: '/claim', label: 'Submit Claim', icon: '📝' },
    { path: '/admin', label: 'Admin', icon: '⚙️' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <nav className="border-b border-gray-800 bg-stellar-dark/80 backdrop-blur-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-claimchain-primary to-claimchain-secondary rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold">⛓️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">ClaimChain</h1>
              <p className="text-xs text-claimchain-accent">PH</p>
            </div>
          </Link>

          {/* Navigation Links */}
          {isConnected && (
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive(link.path)
                      ? 'bg-claimchain-primary text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {/* Wallet Status */}
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <>
                <div className="hidden sm:flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-300 font-mono">
                    {formatAddress(walletAddress, 6)}
                  </span>
                </div>
                <button
                  onClick={onDisconnect}
                  className="text-sm text-gray-400 hover:text-red-400 transition-colors"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <span className="text-sm text-gray-500">Not connected</span>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isConnected && (
          <div className="md:hidden flex overflow-x-auto pb-3 -mx-4 px-4 space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.path)
                    ? 'bg-claimchain-primary text-white'
                    : 'text-gray-400 bg-gray-800'
                }`}
              >
                <span className="mr-1">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
