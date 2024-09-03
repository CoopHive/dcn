# Compute Marketplace Example using Coophive EAS Composables
[EAS](https://github.com/ethereum-attestation-service/eas-contracts) "Enables a powerful new range of web3 applications" which are useful to solving and improving on open problems in depin ecosystem.
Protocols can now integrate existing portable trust layers, KYC solutions and uncollateralized borrowing/lending schemes to assist in compute verification, compliance and resource efficiency.
This project demonstrates a basic compute deal workflow using Coophive EAS Composables.

## Prerequisites

- [Base Sepolia Testnet](https://sepolia.basescan.org/)
- [Filecoin Calibration](https://docs.filecoin.io/networks/calibration)
- [Alchemy](https://www.alchemy.com/) for an rpcUrl to base sepolia
- [Faucet](https://www.alchemy.com/faucets/base-sepolia)

- [Bun](https://bun.sh)
- [Docker](https://www.docker.com/)


### Useful Links
- [EAS](https://github.com/ethereum-attestation-service/eas-contracts)
- [Redis](https://redis.io/)
- [Anvil](https://anvil.readthedocs.io/en/latest/)
- [Ethereum SDK](https://viem.sh/docs/getting-started)

## Running Locally
### Hardhat
1. `cd hardhat`
3. `cp .env.example .env`

### DCN-js
1. `cd dcn-js`
2. `cp .env.example .env` fill out
3. get base sepolia testnet crypto on 3 pks, one for buyer, seller and validator
8. `bun install`
9. `docker compose up`


### Contract Tests
1. `npx hardhat test`
Mocha/Chai hardhat tests
3. `npx hardhat deploy --network baseSepolia`
   Deploy contracts to base sepolia chain
5. `npx hardhat run ./scripts/registerSchemas.ts --network baseSepolia`
  Register and link the contracts to EAS
7. `npx hardhat run ./scripts/confirmBaseSepoliaDeployment.ts --network baseSepolia`
 Check if things look okay

### Network Tests

10. `bun test --timout 60000`
    run the e2e poc


[demo-quick.webm](https://github.com/user-attachments/assets/f04af4cd-20f2-48ef-93ed-2f876f5883c4)
