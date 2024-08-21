import { getContract } from 'viem'
import hre from 'hardhat';
import EAS from '../external/EAS.json';
import SchemaRegistry from '../external/SchemaRegistry.json';

import TrustedValidatorResolver from '../deployments/baseSepolia/TrustedValidatorResolver.json';
import BuyCollateralResolver from '../deployments/baseSepolia/BuyCollateralResolver.json';
import SellCollateralResolver from '../deployments/baseSepolia/SellCollateralResolver.json';


import { buySchema, sellSchema, validationSchema } from "coophive-sdk";

async function main() {
  const [deployer] = await hre.viem.getWalletClients();
  const eas = await getContract({
    abi: EAS.abi,
    address: EAS.addressBaseSepolia as `0x${string}`,
    client: {wallet: deployer}
  });
  const schemaRegistry = await getContract({
    abi: SchemaRegistry.abi,
    address: SchemaRegistry.addressBaseSepolia as `0x${string}`,
    client: {wallet: deployer}
  });

  //await schemaRegistry.write.register([validationSchema, TrustedValidatorResolver.address, true]);
  //console.log(BuyCollateralResolver.address);
  //await schemaRegistry.write.register([buySchema, BuyCollateralResolver.address, true]);

  await schemaRegistry.write.register([sellSchema, SellCollateralResolver.address, true]);
}


  main().catch((error) => {
      console.error(error);
        process.exitCode = 1;
        
  });
