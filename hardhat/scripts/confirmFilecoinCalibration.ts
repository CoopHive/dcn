
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

import BuyCollateralResolver from '../deployments/filecoinCalibration/BuyCollateralResolver.json';
import SellCollateralResolver from '../deployments/filecoinCalibration/SellCollateralResolver.json';
import TrustedValidationResolver from '../deployments/filecoinCalibration/TrustedValidationResolver.json';
async function main() {

  let erc20Addr: `0x${string}`;

  let validatorSchemaUID: `0x${string}` = '0xdb7190df8792aa2215315564ebe9ecedde2c1fc49d4813dd70fbbb1c39c04c63'
  let buyerSchemaUID: `0x${string}` = '0xf7d9f03d8871c6dcae7932b9d9b597fcdb2b364b103fd88672b9fb74d52eb3d8'
  let sellerSchemaUID: `0x${string}` = '0x22922e41634c00a271cabf296610c50fcbeab8590a4019fd6f01c55a2c9a86bf' 

  //const easAddr: `0x${string}` = '0x4200000000000000000000000000000000000021'
  //const schemaRegistryAddr: `0x${string}` = '0x4200000000000000000000000000000000000020'
  //
   const publicClient = await hre.viem.getPublicClient();
   const [deployer] = await hre.viem.getWalletClients();

   const schemaRegistry = await getContract({
     abi: SchemaRegistry.abi,
     address: SchemaRegistry.addressFilecoinCalibration as `0x${string}`,
     client: {wallet: deployer}
   })
   
   const eas = await getContract({
     abi: EAS.abi,
     address: EAS.addressFilecoinCalibration as `0x${string}`,
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



