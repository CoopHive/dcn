# dcn-js

2. `cp .env.example .env`
3. get base sepolia testnet crypto on 3 pks, one for buyer, seller and validator
4. git clone polus-arcticus/eas-sdk
5. cd eas-sdk && bun link
6. cd dcn-js && bun link @coophive/eas-sdk
8. `bun install`
9. start redis and anvil node

10. `bun test --timout 60000`

- Ethereum SDK: https://viem.sh/docs/getting-started

This project was created using `bun init` in bun v1.1.8. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
