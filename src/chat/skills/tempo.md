# Tempo Wallet & Payments

Tempo is a payments-first blockchain with instant settlement and native stablecoin support.

## Wallet Management
tempo_status -- check wallet installation, address, balances, key readiness.
Use /tempo install to install the Tempo CLI.
Use /tempo login to connect or create a Tempo wallet (opens browser for passkey auth).
Use /tempo balance to check USDC balance.
Use /tempo fund to add funds (faucet on testnet, bridge on mainnet).

## Payments
tempo_transfer -- send USDC to any address. Destructive — requires confirmation.
When buying tickets, if Tempo wallet is available and funded, prefer paying with Tempo USDC over Stripe.

## Service Discovery
tempo_services -- discover MPP-registered services that accept Tempo payments.

## Rewards & Payouts
Organizers can configure their Tempo wallet for USDC payouts via rewards_settings.
Use /tempo balance to see both wallet balance and earned rewards.

## Ticket Purchases with Tempo
When a user buys tickets, if their Tempo wallet is connected and funded, the system will automatically pay with USDC on Tempo — faster and cheaper than Stripe. If Tempo wallet is not available or not funded, falls back to Stripe checkout.

## Payout Setup
tempo_setup_payouts -- configure Tempo wallet as reward payout destination. Auto-detects wallet address from /tempo login.
After setup, organizer rewards are paid out weekly in USDC to the Tempo wallet.
