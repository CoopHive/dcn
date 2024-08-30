import { buildModule  } from "@nomicfoundation/hardhat-ignition/modules";
import { getContract } from 'viem'
import hre from 'hardhat';
import EAS from '../external/EAS.json';
import SchemaRegistry from '../external/SchemaRegistry.json';
//import { buySchema, sellSchema, validationSchema } from "coophive-sdk";

const buySchema: string  = "address supplier, uint256 jobCost, address paymentToken, string image, string prompt, uint256 collateralRequested, uint256 offerDeadline, uint256 jobDeadline, uint256 arbitrationDeadline"  
const sellSchema: string = "uint256 collateral"
const validationSchema: string = "bool isApproved"

console.log(buySchema, sellSchema, validationSchema)
export default async ({deployments}) => {
  const [ deployer ] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();
  const {deploy} = deployments;

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



  const tvResolver = await deploy("TrustedValidatorResolver", {
    from: deployer.account.address,
    args: [eas.address, deployer.account.address],
    log: true
  })
  console.log('hi')

  const buyResolver = await deploy("BuyCollateralResolver", {
    from: deployer.account.address,
    args: [eas.address, tvResolver.address],
    log: true
  })

  const sellResolver = await deploy("SellCollateralResolver", {
    from: deployer.account.address,
    args: [eas.address, tvResolver.address],
    log: true
  })

  let hash = await schemaRegistry.write.register([validationSchema, tvResolver.address, true]);
  let receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('validatorSchema UID', receipt.logs[0].topics[1])
  
  hash = await schemaRegistry.write.register([buySchema, buyResolver.address, true]);
  receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('buySchema UID', receipt.logs[0].topics[1])

  hash = await schemaRegistry.write.register([sellSchema, sellResolver.address, true]);
  receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('sellSchema UID', receipt.logs[0].topics[1])

}
