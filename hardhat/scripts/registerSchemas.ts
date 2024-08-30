import { getContract } from 'viem'
import hre from 'hardhat';
import EAS from '../external/EAS.json';
import SchemaRegistry from '../external/SchemaRegistry.json';

//import TrustedValidatorResolver from '../deployments/baseSepolia/TrustedValidatorResolver.json';
//import BuyCollateralResolver from '../deployments/baseSepolia/BuyCollateralResolver.json';
//import SellCollateralResolver from '../deployments/baseSepolia/SellCollateralResolver.json';
import TrustedValidatorResolver from '../deployments/filecoinCalibration/TrustedValidatorResolver.json';
import BuyCollateralResolver from '../deployments/filecoinCalibration/BuyCollateralResolver.json';
import SellCollateralResolver from '../deployments/filecoinCalibration/SellCollateralResolver.json';


const buySchema: string  = "address supplier, uint256 jobCost, address paymentToken, string image, string prompt, uint256 collateralRequested, uint256 offerDeadline, uint256 jobDeadline, uint256 arbitrationDeadline"  
const sellSchema: string = "uint256 collateral"
const validationSchema: string = "bool isApproved"


async function main() {
  const [deployer] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();
  const eas = await getContract({
    abi: EAS.abi,
    //address: EAS.addressBaseSepolia as `0x${string}`,
    address: EAS.addressFilecoinCalibration as `0x${string}`,
    client: {wallet: deployer}
  });
  const schemaRegistry = await getContract({
    abi: SchemaRegistry.abi,
    //address: SchemaRegistry.addressBaseSepolia as `0x${string}`,
    address: SchemaRegistry.addressFilecoinCalibration as `0x${string}`,
    client: {wallet: deployer}
  });


  const trustedValidatorResolver = await getContract({
    abi: TrustedValidatorResolver.abi,
    address: TrustedValidatorResolver.address as `0x${string}`,
    client: {wallet: deployer}
  });
  /*
  let hash = await schemaRegistry.write.register([validationSchema, TrustedValidatorResolver.address, true]);
  let receipt = await publicClient.waitForTransactionReceipt({ hash });
  //console.log(BuyCollateralResolver.address);
  hash =  await schemaRegistry.write.register([buySchema, BuyCollateralResolver.address, true]);
  receipt = await publicClient.waitForTransactionReceipt({ hash });

  hash =  await schemaRegistry.write.register([sellSchema, SellCollateralResolver.address, true]);
  receipt = await publicClient.waitForTransactionReceipt({ hash });
*/
  let hash = await trustedValidatorResolver.write.setBuyCollateralResolver([BuyCollateralResolver.address]);
  let receipt = await publicClient.waitForTransactionReceipt({ hash });

  hash = await trustedValidatorResolver.write.setSellCollateralResolver([SellCollateralResolver.address]);
  receipt = await publicClient.waitForTransactionReceipt({ hash });
}


  main().catch((error) => {
      console.error(error);
        process.exitCode = 1;
        
  });
