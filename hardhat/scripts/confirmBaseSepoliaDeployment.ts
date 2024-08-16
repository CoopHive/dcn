
import hre from "hardhat";
import { getAddress, parseGwei, getContract } from "viem";
import { WalletClient, PublicClient  } from "@nomicfoundation/hardhat-viem/types";

import SchemaRegistry from '../external/SchemaRegistry.json';
import EAS from '../external/EAS.json';
import { SchemaEncoder, NO_EXPIRATION, ZERO_ADDRESS, ZERO_BYTES32, getUID } from '@ethereum-attestation-service/eas-sdk';

import {
  BuyMessage,
  buySchema, 
  SellMessage,
  sellSchema,
  ValidationMessage,
  validatorSchema
} from "./utils";

import BuyCollateralResolver from '../deployments/baseSepolia/BuyCollateralResolver.json';
import SellCollateralResolver from '../deployments/baseSepolia/SellCollateralResolver.json';
import TrustedValidationResolver from '../deployments/baseSepolia/TrustedValidationResolver.json';

async function main() {

  let erc20Addr: `0x${string}`;

  let buyerSchemaUID: `0x${string}` = '0x5ab6e882c945d6d756ed93fff7ec7419fec64845cc0a480bfea2af053d685ee7'
  let sellerSchemaUID: `0x${string}` = '0x06d7582e367e1ba8ceafd2e75d7c3f35c10ad488bdc79f18433ed4b18705b662'
  let validatorSchemaUID: `0x${string}` = '0x9581c888ba04af2923f453471f58f2dc70a23ee765142714853a623c88d866cf' 

  //const easAddr: `0x${string}` = '0x4200000000000000000000000000000000000021'
  //const schemaRegistryAddr: `0x${string}` = '0x4200000000000000000000000000000000000020'
  //
   const publicClient = await hre.viem.getPublicClient();
   const [deployer] = await hre.viem.getWalletClients();

   const schemaRegistry = await getContract({
     abi: SchemaRegistry.abi,
     address: SchemaRegistry.addressBaseSepolia as `0x${string}`,
     client: {wallet: deployer}
   })
   
   const eas = await getContract({
     abi: EAS.abi,
     address: EAS.addressBaseSepolia as `0x${string}`,
     client: {wallet: deployer}
   })

   const buyerSchema = await publicClient.readContract({
     abi: schemaRegistry.abi,
     address: schemaRegistry.address,
     functionName: 'getSchema',
     args: [buyerSchemaUID]
   })

   console.log('buyerSchema', buyerSchema)
   
   const sellerSchema = await publicClient.readContract({
     abi: schemaRegistry.abi,
     address: schemaRegistry.address,
     functionName: 'getSchema',
     args: [sellerSchemaUID]
   })

   console.log('sellerSchema', sellerSchema)

   const validatorSchema = await publicClient.readContract({
     abi: schemaRegistry.abi,
     address: schemaRegistry.address,
     functionName: 'getSchema',
     args: [validatorSchemaUID]
   })

   console.log('validatorSchema', validatorSchema)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
})



