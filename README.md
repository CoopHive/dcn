# Compute Marketplace Example using Coophive EAS Composables
[EAS](https://github.com/ethereum-attestation-service/eas-contracts) "Enables a powerful new range of web3 applications" which are useful to solving and improving on open problems in depin ecosystem.
Protocols can now integrate existing portable trust layers, KYC solutions and uncollateralized borrowing/lending schemes to assist in compute verification, compliance and resource efficiency.
This project demonstrates a basic compute deal workflow using Coophive EAS Composables.

## Prerequisites

- [Base Sepolia Testnet](https://sepolia.basescan.org/)
- [Alchemy](https://www.alchemy.com/) for an rpcUrl to base sepolia
- [Faucet](https://www.alchemy.com/faucets/base-sepolia)

- [Bun](https://bun.sh)
- [Docker](https://www.docker.com/)


### Useful Links
- [EAS](https://github.com/ethereum-attestation-service/eas-contracts)
- [Redis](https://redis.io/)
- [Anvil](https://anvil.readthedocs.io/en/latest/)
- [Ethereum SDK](https://viem.sh/docs/getting-started)

## Hardhat
1. `cd hardhat`
2. `cp .env.example .env`

### Usage
1. `npx hardhat test`
2. `npx hardhat deploy --network baseSepolia`
3. `npx hardhat run ./scripts/registerSchemas.ts --network baseSepolia`
4. `npx hardhat run ./scripts/confirmBaseSepoliaDeployment.ts --network baseSepolia`

## Network
1. `cd dcn-js`
2. `cp .env.example .env` fill out
3. get base sepolia testnet crypto on 3 pks, one for buyer, seller and validator
8. `bun install`
9. `docker compose up`

10. `bun test --timout 60000`
