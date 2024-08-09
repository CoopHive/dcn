import { getContract } from 'viem'
import hre from 'hardhat';
import EAS from '../external/EAS.json';
import SchemaRegistry from '../external/SchemaRegistry.json';

import TrustedValidatorResolver from '../deployments/baseSepolia/TrustedValidatorResolver.json';
import BuyCollateralResolver from '../deployments/baseSepolia/BuyCollateralResolver.json';
import SellCollateralResolver from '../deployments/baseSepolia/SellCollateralResolver.json';


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

  //let validatorSchema: string = "bool isApproved"
  //await schemaRegistry.write.register([validatorSchema, TrustedValidatorResolver.address, true]);
  console.log(BuyCollateralResolver.address);
  //const buySchema: string = "address supplier, uint256 jobCost, address paymentToken, uint256 creditsRequested, uint256 collateralRequested, uint256 offerDeadline, uint256 jobDeadline, uint256 arbitrationDeadline"  
  //await schemaRegistry.write.register([buySchema, BuyCollateralResolver.address, false]);

  let sellSchema: string = "uint256 collateral"
  await schemaRegistry.write.register([sellSchema, SellCollateralResolver.address, true]);
}


  main().catch((error) => {
      console.error(error);
        process.exitCode = 1;
        
  });
