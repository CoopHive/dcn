
import hre from "hardhat";
import { getAddress, parseGwei, getContract } from "viem";
import { WalletClient, PublicClient  } from "@nomicfoundation/hardhat-viem/types";

import SchemaRegistry from '../external/SchemaRegistry.json';
import EAS from '../external/EAS.json';
import { SchemaEncoder, NO_EXPIRATION, ZERO_ADDRESS, ZERO_BYTES32, getUID } from '@ethereum-attestation-service/eas-sdk';

import {
  BuyMessage,
  //buySchema, 
  SellMessage,
  //sellSchema,
  ValidationMessage,
  //validatorSchema
} from "coophive-sdk";

import BuyCollateralResolver from '../deployments/baseSepolia/BuyCollateralResolver.json';
import SellCollateralResolver from '../deployments/baseSepolia/SellCollateralResolver.json';
import TrustedValidationResolver from '../deployments/baseSepolia/TrustedValidationResolver.json';

async function main() {

  let erc20Addr: `0x${string}`;

  let buyerSchemaUID: `0x${string}` = '0x7674c84acee890ef03bdbe281853efce9a10afe427dbfb203577ff3137bd0349'
  let validatorSchemaUID: `0x${string}` = '0xf91e3931e3cf85fc255a403e5ccec30d9d05fa7612ccad90eb9297d52d490979'
  let sellerSchemaUID: `0x${string}` = '0x4d2b0cd74e4002985777098314337ba532d5784c745a6486c852753dbe7f262e' 

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



