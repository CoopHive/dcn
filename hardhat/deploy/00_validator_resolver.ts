import { buildModule  } from "@nomicfoundation/hardhat-ignition/modules";
import { getContract } from 'viem'
import hre from 'hardhat';
import EAS from '../external/EAS.json';
import SchemaRegistry from '../external/SchemaRegistry.json';
import { buySchema, sellSchema, validationSchema } from "coophive-sdk";
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

  //await schemaRegistry.write.register([validationSchema, tvResolver.address, true]);
  
  //await schemaRegistry.write.register([buySchema, buyResolver.address, true]);

  //await schemaRegistry.write.register([sellSchema, sellResolver.address, true]);

}
