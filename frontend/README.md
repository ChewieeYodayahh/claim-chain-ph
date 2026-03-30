# ClaimChain PH Frontend

React + Vite frontend for ClaimChain PH - Stellar-based insurance claims system.

## Tech Stack

- React 18 + Vite
- TailwindCSS
- @stellar/stellar-sdk
- @stellar/freighter-api

## Getting Started

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   http://localhost:5173

## Environment Variables

The `.env` file contains:
- `VITE_CONTRACT_ID` - Deployed Soroban contract ID
- `VITE_NETWORK` - Stellar network (testnet/mainnet)
- `VITE_ADMIN_ADDRESS` - Admin wallet for claim approvals

## Features

- 🔗 Wallet connection (Freighter)
- 📋 Policy registration with document hashing
- 💳 Premium payment activation
- 📝 Claim submission with proof documents
- ⚙️ Admin panel for claim approvals
- 📊 Dashboard with policy/claim status

## Demo Flow

1. Connect Freighter wallet
2. Register Policy → Enter details → Generate hash
3. Pay Premium → Activate policy
4. Submit Claim → Upload hospital bill → Submit
5. Admin approves → Instant USDC payout!

## Deployment

```bash
npm run build
```

Deploy the `dist/` folder to Vercel, Netlify, or any static host.
