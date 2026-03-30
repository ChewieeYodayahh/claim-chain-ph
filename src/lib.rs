#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, symbol_short};
 
#[cfg(test)]
mod test;
 
/// Storage keys for the contract
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Maps policy hash to policy data
    Policy(String),
    /// Tracks if a policy hash has been registered
    Registered(String),
    /// Maps claim ID to claim data
    Claim(u64),
    /// Counter for claim IDs
    ClaimCounter,
    /// Admin address for claim approvals
    Admin,
}
 
/// Policy data structure
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Policy {
    pub policy_hash: String,
    pub owner: Address,
    pub coverage_amount: i128,      // in USDC (6 decimals)
    pub expiry_timestamp: u64,
    pub premium_paid: bool,
    pub active: bool,
}
 
/// Claim data structure
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Claim {
    pub claim_id: u64,
    pub policy_hash: String,
    pub claimant: Address,
    pub document_hash: String,      // Hospital bill or proof document hash
    pub claim_amount: i128,         // in USDC (6 decimals)
    pub status: ClaimStatus,
    pub submitted_at: u64,
}
 
/// Claim status enum
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ClaimStatus {
    Pending,
    Approved,
    Rejected,
    Paid,
}
 
#[contract]
pub struct ClaimChainContract;
 
#[contractimpl]
impl ClaimChainContract {
    /// Initialize the contract with admin address
    /// admin: Address authorized to approve/reject claims
    pub fn initialize(env: Env, admin: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::ClaimCounter, &0u64);
    }
 
    /// Register a new insurance policy on-chain
    /// Prevents duplicate issuance and stores policy details
    /// 
    /// policy_hash: Unique hash of the policy document (e.g., SHA256)
    /// owner: Wallet address of the policyholder
    /// coverage_amount: Total coverage in USDC (e.g., 1000000 = $1,000 USDC)
    /// expiry_timestamp: Unix timestamp when policy expires
    /// 
    /// Returns: true if registration successful, panics if duplicate detected
    pub fn register_policy(
        env: Env,
        policy_hash: String,
        owner: Address,
        coverage_amount: i128,
        expiry_timestamp: u64,
    ) -> bool {
        // Require authorization from the owner
        owner.require_auth();
 
        let registered_key = DataKey::Registered(policy_hash.clone());
        
        // Check for duplicate registration (tamper detection)
        if env.storage().instance().has(&registered_key) {
            panic!("Policy already registered - duplicate detected");
        }
 
        // Create policy record
        let policy = Policy {
            policy_hash: policy_hash.clone(),
            owner: owner.clone(),
            coverage_amount,
            expiry_timestamp,
            premium_paid: false,
            active: false,
        };
 
        // Store policy data
        env.storage().instance().set(&DataKey::Policy(policy_hash.clone()), &policy);
        env.storage().instance().set(&registered_key, &true);
 
        // Emit event for policy registration
        env.events().publish((symbol_short!("REGISTER"),), (policy_hash.clone(), owner));
 
        true
    }
 
    /// Mark premium as paid and activate policy
    /// Called after policyholder pays premium in XLM
    /// 
    /// policy_hash: Hash of the policy to activate
    pub fn pay_premium(env: Env, policy_hash: String) -> bool {
        let policy_key = DataKey::Policy(policy_hash.clone());
        
        let mut policy: Policy = env.storage()
            .instance()
            .get(&policy_key)
            .expect("Policy not found");
 
        // Require authorization from policy owner
        policy.owner.require_auth();
 
        // Mark premium as paid and activate policy
        policy.premium_paid = true;
        policy.active = true;
 
        // Update storage
        env.storage().instance().set(&policy_key, &policy);
 
        // Emit event
        env.events().publish((symbol_short!("PREMIUM"),), (policy_hash.clone(), policy.owner));
 
        true
    }
 
    /// Submit a claim for an active policy
    /// 
    /// policy_hash: Hash of the policy being claimed
    /// document_hash: Hash of supporting documents (hospital bills, etc.)
    /// claim_amount: Amount being claimed in USDC
    /// 
    /// Returns: claim_id for tracking
    pub fn submit_claim(
        env: Env,
        policy_hash: String,
        document_hash: String,
        claim_amount: i128,
    ) -> u64 {
        let policy_key = DataKey::Policy(policy_hash.clone());
        
        let policy: Policy = env.storage()
            .instance()
            .get(&policy_key)
            .expect("Policy not found");
 
        // Require authorization from policy owner
        policy.owner.require_auth();
 
        // Validate policy is active
        if !policy.active {
            panic!("Policy is not active");
        }
 
        // Check policy has not expired
        let current_time = env.ledger().timestamp();
        if current_time > policy.expiry_timestamp {
            panic!("Policy has expired");
        }
 
        // Validate claim amount does not exceed coverage
        if claim_amount > policy.coverage_amount {
            panic!("Claim amount exceeds coverage");
        }
 
        // Get and increment claim counter
        let claim_id: u64 = env.storage()
            .instance()
            .get(&DataKey::ClaimCounter)
            .unwrap_or(0);
        
        let new_claim_id = claim_id + 1;
        env.storage().instance().set(&DataKey::ClaimCounter, &new_claim_id);
 
        // Create claim record
        let claim = Claim {
            claim_id: new_claim_id,
            policy_hash: policy_hash.clone(),
            claimant: policy.owner.clone(),
            document_hash,
            claim_amount,
            status: ClaimStatus::Pending,
            submitted_at: current_time,
        };
 
        // Store claim
        env.storage().instance().set(&DataKey::Claim(new_claim_id), &claim);
 
        // Emit event
        env.events().publish(
            (symbol_short!("CLAIM"),),
            (new_claim_id, policy_hash, policy.owner, claim_amount),
        );
 
        new_claim_id
    }
 
    /// Approve a claim (admin only)
    /// 
    /// claim_id: ID of the claim to approve
    pub fn approve_claim(env: Env, claim_id: u64) -> bool {
        // Get admin address
        let admin: Address = env.storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");
 
        // Require admin authorization
        admin.require_auth();
 
        let claim_key = DataKey::Claim(claim_id);
        let mut claim: Claim = env.storage()
            .instance()
            .get(&claim_key)
            .expect("Claim not found");
 
        // Validate claim is pending
        if claim.status != ClaimStatus::Pending {
            panic!("Claim is not in pending status");
        }
 
        // Update claim status to approved
        claim.status = ClaimStatus::Approved;
        env.storage().instance().set(&claim_key, &claim);
 
        // Emit event
        env.events().publish((symbol_short!("APPROVE"),), (claim_id, claim.claimant));
 
        true
    }
 
    /// Verify if a policy exists and is active
    /// Returns boolean and emits an on-chain event
    /// 
    /// policy_hash: Hash of the policy to verify
    pub fn verify_policy(env: Env, policy_hash: String) -> bool {
        let policy_key = DataKey::Policy(policy_hash.clone());
        
        let policy_exists = env.storage().instance().has(&policy_key);
        
        if !policy_exists {
            env.events().publish((symbol_short!("VERIFY"),), (policy_hash.clone(), false));
            return false;
        }
 
        let policy: Policy = env.storage()
            .instance()
            .get(&policy_key)
            .unwrap();
 
        let is_active = policy.active && policy.premium_paid;
        
        // Emit verification event
        env.events().publish(
            (symbol_short!("VERIFY"),),
            (policy_hash, is_active, policy.owner),
        );
 
        is_active
    }
 
    /// Check if policy is expiring soon (within 30 days)
    /// Used for auto-alerts
    /// 
    /// policy_hash: Hash of the policy to check
    pub fn check_expiry_alert(env: Env, policy_hash: String) -> bool {
        let policy_key = DataKey::Policy(policy_hash.clone());
        
        let policy: Policy = env.storage()
            .instance()
            .get(&policy_key)
            .expect("Policy not found");
 
        let current_time = env.ledger().timestamp();
        let thirty_days_in_seconds: u64 = 30 * 24 * 60 * 60;
 
        // Check if expiring within 30 days
        let is_expiring_soon = policy.expiry_timestamp - current_time <= thirty_days_in_seconds;
 
        if is_expiring_soon {
            env.events().publish(
                (symbol_short!("EXPIRING"),),
                (policy_hash, policy.owner, policy.expiry_timestamp),
            );
        }
 
        is_expiring_soon
    }
 
    /// Get policy details
    /// 
    /// policy_hash: Hash of the policy to retrieve
    pub fn get_policy(env: Env, policy_hash: String) -> Policy {
        let policy_key = DataKey::Policy(policy_hash);
        
        env.storage()
            .instance()
            .get(&policy_key)
            .expect("Policy not found")
    }
 
    /// Get claim details
    /// 
    /// claim_id: ID of the claim to retrieve
    pub fn get_claim(env: Env, claim_id: u64) -> Claim {
        let claim_key = DataKey::Claim(claim_id);
        
        env.storage()
            .instance()
            .get(&claim_key)
            .expect("Claim not found")
    }
}