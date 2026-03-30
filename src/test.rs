#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};
 
#[test]
fn test_happy_path_policy_registration_and_claim() {
    // Test 1 (Happy path): A policy is successfully registered, premium paid, claim submitted and approved
    
    let env = Env::default();
    let contract_id = env.register_contract(None, ClaimChainContract);
    let client = ClaimChainContractClient::new(&env, &contract_id);
 
    // Setup addresses
    let admin = Address::generate(&env);
    let policyholder = Address::generate(&env);
 
    // Mock auth for all operations
    env.mock_all_auths();
 
    // Initialize contract
    client.initialize(&admin);
 
    // Register policy
    let policy_hash = String::from_str(&env, "policy_abc123");
    let coverage_amount: i128 = 1_000_000; // $1,000 USDC (6 decimals)
    let expiry_timestamp: u64 = env.ledger().timestamp() + (365 * 24 * 60 * 60); // 1 year from now
 
    let registered = client.register_policy(
        &policy_hash,
        &policyholder,
        &coverage_amount,
        &expiry_timestamp,
    );
 
    assert_eq!(registered, true);
 
    // Pay premium to activate policy
    let premium_paid = client.pay_premium(&policy_hash);
    assert_eq!(premium_paid, true);
 
    // Verify policy is active
    let is_active = client.verify_policy(&policy_hash);
    assert_eq!(is_active, true);
 
    // Submit a claim
    let document_hash = String::from_str(&env, "hospital_bill_xyz789");
    let claim_amount: i128 = 500_000; // $500 USDC claim
 
    let claim_id = client.submit_claim(&policy_hash, &document_hash, &claim_amount);
    assert_eq!(claim_id, 1); // First claim should have ID 1
 
    // Admin approves claim
    let approved = client.approve_claim(&claim_id);
    assert_eq!(approved, true);
 
    // Verify claim status is approved
    let claim = client.get_claim(&claim_id);
    assert_eq!(claim.status, ClaimStatus::Approved);
    assert_eq!(claim.claim_amount, claim_amount);
    assert_eq!(claim.claimant, policyholder);
}
 
#[test]
#[should_panic(expected = "Policy already registered - duplicate detected")]
fn test_duplicate_policy_registration_rejected() {
    // Test 2 (Edge case): A duplicate policy registration is rejected with the correct error
    
    let env = Env::default();
    let contract_id = env.register_contract(None, ClaimChainContract);
    let client = ClaimChainContractClient::new(&env, &contract_id);
 
    let admin = Address::generate(&env);
    let policyholder = Address::generate(&env);
 
    env.mock_all_auths();
 
    // Initialize contract
    client.initialize(&admin);
 
    // Register policy first time
    let policy_hash = String::from_str(&env, "policy_duplicate_test");
    let coverage_amount: i128 = 500_000;
    let expiry_timestamp: u64 = env.ledger().timestamp() + (365 * 24 * 60 * 60);
 
    client.register_policy(
        &policy_hash,
        &policyholder,
        &coverage_amount,
        &expiry_timestamp,
    );
 
    // Attempt to register same policy hash again (should panic)
    client.register_policy(
        &policy_hash,
        &policyholder,
        &coverage_amount,
        &expiry_timestamp,
    );
}
 
#[test]
fn test_state_verification_after_registration() {
    // Test 3 (State verification): Contract storage correctly reflects policy data after registration
    
    let env = Env::default();
    let contract_id = env.register_contract(None, ClaimChainContract);
    let client = ClaimChainContractClient::new(&env, &contract_id);
 
    let admin = Address::generate(&env);
    let policyholder = Address::generate(&env);
 
    env.mock_all_auths();
 
    // Initialize contract
    client.initialize(&admin);
 
    // Register policy
    let policy_hash = String::from_str(&env, "policy_state_test");
    let coverage_amount: i128 = 2_000_000; // $2,000 USDC
    let expiry_timestamp: u64 = env.ledger().timestamp() + (180 * 24 * 60 * 60); // 6 months
 
    client.register_policy(
        &policy_hash,
        &policyholder,
        &coverage_amount,
        &expiry_timestamp,
    );
 
    // Retrieve and verify stored policy
    let stored_policy = client.get_policy(&policy_hash);
 
    assert_eq!(stored_policy.policy_hash, policy_hash);
    assert_eq!(stored_policy.owner, policyholder);
    assert_eq!(stored_policy.coverage_amount, coverage_amount);
    assert_eq!(stored_policy.expiry_timestamp, expiry_timestamp);
    assert_eq!(stored_policy.premium_paid, false); // Premium not yet paid
    assert_eq!(stored_policy.active, false); // Policy not yet active
 
    // Pay premium
    client.pay_premium(&policy_hash);
 
    // Verify state updated correctly
    let updated_policy = client.get_policy(&policy_hash);
    assert_eq!(updated_policy.premium_paid, true);
    assert_eq!(updated_policy.active, true);
}