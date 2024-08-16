import { buildModule  } from "@nomicfoundation/hardhat-ignition/modules";
import { getContract } from 'viem'
import hre from 'hardhat';
import EAS from '../external/EAS.json';
import SchemaRegistry from '../external/SchemaRegistry.json';

export default async ({deployments}) => {
  const [ deployer ] = await hre.viem.getWalletClients();
  const {deploy} = deployments;

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

  let validatorSchema: string = "bool isApproved"
  await schemaRegistry.write.register([validatorSchema, tvResolver.address, true]);

  const buySchema: string = "address supplier, uint256 jobCost, address paymentToken, uint256 creditsRequested, uint256 collateralRequested, uint256 offerDeadline, uint256 jobDeadline, uint256 arbitrationDeadline"  
  await schemaRegistry.write.register([buySchema, buyResolver.address, true]);

  let sellSchema: string = "uint256 collateral"
  await schemaRegistry.write.register([sellSchema, sellResolver.address, true]);

}
