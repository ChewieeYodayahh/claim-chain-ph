# ClaimChain PH

**Instant insurance claims on Stellar — eliminating paperwork, agent dependency, and week-long delays**

---

## Problem

A 28-year-old working professional in Manila with a 5-year term life insurance policy faces a medical emergency but cannot file a claim quickly because paper forms take 2-3 weeks to process, her agent left the company, and she has no clear proof of her premium payment history or policy expiry date—costing her ₱50,000 in out-of-pocket hospital bills while waiting.

## Solution

Using Stellar, ClaimChain PH registers insurance policies on-chain with a unique policy ID (hash + owner wallet), tracks premium payments and expiry dates automatically via smart contracts, allows policyholders to submit claims with document hash verification, and triggers instant USDC payouts to verified wallets upon approval—eliminating paperwork, agent dependency, and week-long delays.

---

## Suggested Timeline for MVP Delivery

| Week | Milestone |
|------|-----------|
| Week 1 | Smart contract development + testing |
| Week 2 | Frontend UI (policy registration + claim submission) |
| Week 3 | Integration with Freighter wallet + testnet deployment |
| Week 4 | Demo preparation + polish |

**Total:** 4 weeks to hackathon-ready MVP

---

## Stellar Features Used

✅ **Soroban smart contracts** — Core policy registry, premium tracking, claim submission logic, automatic expiry alerts  
✅ **USDC transfers** — Instant claim payouts to policyholder wallet  
✅ **XLM transfers** — Premium payments in XLM  
✅ **Custom tokens** (optional) — Policy tokens representing coverage units  
✅ **Trustlines** — Credential asset ownership  

---

## Prerequisites

Before building and deploying, ensure you have:

- **Rust toolchain** (v1.74.0 or later)
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  rustup target add wasm32-unknown-unknown
  ```

- **Soroban CLI** (v21.5.0 or later)
  ```bash
  cargo install --locked soroban-cli --features opt
  ```

- **Stellar account** with testnet XLM
  ```bash
  soroban keys generate admin --network testnet
  soroban keys address admin
  ```

- **Fund your testnet account**
  ```bash
  curl "https://friendbot.stellar.org?addr=$(soroban keys address admin)"
  ```

---

## How to Build

Compile the smart contract to Wasm:

```bash
soroban contract build
```

This generates the optimized `.wasm` file at:
```
target/wasm32-unknown-unknown/release/claimchain_ph.wasm
```

---

## How to Test

Run all 3 tests locally:

```bash
cargo test
```

**Expected output:**
```
running 3 tests
test test::test_happy_path_policy_registration_and_claim ... ok
test test::test_duplicate_policy_registration_rejected ... ok
test test::test_state_verification_after_registration ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

---

## How to Deploy to Testnet

### Step 1: Deploy the Contract

```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/claimchain_ph.wasm \
  --source admin \
  --network testnet
```

**Output example:**
```
CDQQ... (your contract ID)
```

Save this contract ID — you'll need it for all interactions.

### Step 2: Initialize the Contract

```bash
soroban contract invoke \
  --id <YOUR_CONTRACT_ID> \
  --source admin \
  --network testnet \
  -- \
  initialize \
  --admin <ADMIN_WALLET_ADDRESS>
```

---

## Sample CLI Invocations

### Register a Policy

```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source policyholder \
  --network testnet \
  -- \
  register_policy \
  --policy_hash "policy_abc123xyz" \
  --owner <POLICYHOLDER_WALLET_ADDRESS> \
  --coverage_amount "1000000" \
  --expiry_timestamp "1756540800"
```

**Parameters:**
- `policy_hash`: Unique SHA256 hash of policy document
- `owner`: Policyholder's Stellar wallet address
- `coverage_amount`: Coverage in USDC (6 decimals, e.g., 1000000 = $1,000)
- `expiry_timestamp`: Unix timestamp (e.g., 1756540800 = May 2026)

---

### Pay Premium (Activate Policy)

```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source policyholder \
  --network testnet \
  -- \
  pay_premium \
  --policy_hash "policy_abc123xyz"
```

---

### Verify a Policy

```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source anyone \
  --network testnet \
  -- \
  verify_policy \
  --policy_hash "policy_abc123xyz"
```

**Output:** `true` (if active) or `false` (if inactive/expired)

---

### Submit a Claim

```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source policyholder \
  --network testnet \
  -- \
  submit_claim \
  --policy_hash "policy_abc123xyz" \
  --document_hash "hospital_bill_sha256_xyz" \
  --claim_amount "500000"
```

**Output:** Claim ID (e.g., `1`)

---

### Approve a Claim (Admin Only)

```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source admin \
  --network testnet \
  -- \
  approve_claim \
  --claim_id "1"
```

---

### Check Policy Expiry Alert

```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source anyone \
  --network testnet \
  -- \
  check_expiry_alert \
  --policy_hash "policy_abc123xyz"
```

**Output:** `true` (if expiring within 30 days) or `false`

---

### Get Policy Details

```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source anyone \
  --network testnet \
  -- \
  get_policy \
  --policy_hash "policy_abc123xyz"
```

**Output:** Full policy struct (JSON format)

---

### Get Claim Details

```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source anyone \
  --network testnet \
  -- \
  get_claim \
  --claim_id "1"
```

**Output:** Full claim struct (JSON format)

---

## Project Structure

```
claimchain_ph/
├── Cargo.toml          # Dependencies and build config
├── src/
│   ├── lib.rs          # Main smart contract
│   └── test.rs         # 3 comprehensive tests
└── README.md           # This file
```

---

## Smart Contract Functions

| Function | Description | Authorization |
|----------|-------------|---------------|
| `initialize()` | Set admin address | Anyone (once) |
| `register_policy()` | Register new policy on-chain | Policy owner |
| `pay_premium()` | Activate policy after payment | Policy owner |
| `submit_claim()` | Submit claim with proof | Policy owner |
| `approve_claim()` | Approve pending claim | Admin only |
| `verify_policy()` | Check if policy is active | Anyone |
| `check_expiry_alert()` | Check if expiring within 30 days | Anyone |
| `get_policy()` | Retrieve policy details | Anyone |
| `get_claim()` | Retrieve claim details | Anyone |

---

## Event Emissions

The contract emits the following events for off-chain monitoring:

- `REGISTER` — Policy registered
- `PREMIUM` — Premium paid
- `CLAIM` — Claim submitted
- `APPROVE` — Claim approved
- `VERIFY` — Policy verification attempted
- `EXPIRING` — Policy expiring soon

---

## Why This Wins

ClaimChain PH addresses a **₱180 billion Philippine insurance market** where 97% of claims are still paper-based, directly aligns with Stellar's financial inclusion mission by giving underserved Filipinos instant access to their own money, and demonstrates real-world utility with composability (policy tokens can be used as collateral in DeFi later).

---

## Next Steps

1. **Frontend Development** — Build React app with Freighter wallet integration
2. **OCR + AI** — Auto-extract policy details from uploaded PDFs
3. **Local Anchor Integration** — Partner with PDAX/Coins.ph for PHP-USDC conversion
4. **SMS Alerts** — Offline claim status updates via Twilio
5. **Mainnet Deployment** — Production launch with real insurance partners

---

## License

MIT License

Copyright (c) 2026 ClaimChain PH Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## Contact

For questions, partnerships, or demo requests:
- **GitHub:** [ClaimChain PH Repository]
- **Email:** claimchain.ph@gmail.com
- **Twitter:** @ClaimChainPH

---

**Built with ❤️ on Stellar**
