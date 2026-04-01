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
