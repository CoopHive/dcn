import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseGwei, getContract } from "viem";
import { WalletClient, PublicClient  } from "@nomicfoundation/hardhat-viem/types";
//import EASJson from '../external/EAS.json';
import { SchemaEncoder, NO_EXPIRATION, ZERO_ADDRESS, ZERO_BYTES32 } from '@ethereum-attestation-service/eas-sdk';

type BuyMessage  = [
  supplier: {name: string, value: any, type: string},
  jobCost: {name: string, value: any, type: string},
  creditsRequested: {name: string, value: any, type: string},
  collateralRequested: {name: string, value: any, type: string},
  validator: {name: string, value: any, type: string},
  offerDeadline: {name: string, value: any, type: string},
  jobDeadline: {name: string, value: any, type: string},
  arbitrationDeadline: {name: string, value: any, type: string}
]

describe("DCN6", function () {
  let publicClient: PublicClient;
  let deployer: WalletClient;

  let buyer: WalletClient;
  let seller: WalletClient;
  let validator: WalletClient;

  const easAddress: `0x${string}` = '0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587'
  const schemaRegistryAddress: `0x${string}` = '0xA7b39296258348C78294F95B872b282326A97BDF'
 
  let eas: any; 
  let schemaRegistry: any;

  let buyResolver: any;
  let sellResolver: any;
  let trustedValidatorResolver: any;

  let buySchema: string = "address supplier, uint256 jobCost, uint256 creditsRequested, uint256 collateralRequested, address validator, uint256 offerDeadline, uint256 jobDeadline, uint256 arbitrationDeadline"  
  let buySchemaUID: `0x${string}`;

  let sellSchema: string = "uint256 collateral, address validator"
  let sellSchemaUID: `0x${string}`;

  let validatorSchema: string = "bool isApproved"
  let validatorSchemaUID: `0x${string}`;

  before(async () => {
    publicClient = await hre.viem.getPublicClient();
    [deployer, buyer, seller, validator] = await hre.viem.getWalletClients();
    schemaRegistry = await hre.viem.getContractAt("ISchemaRegistry", schemaRegistryAddress);
    eas = await hre.viem.getContractAt("IEAS", easAddress);

    trustedValidatorResolver = await hre.viem.deployContract(
      "TrustedValidatorResolver",
      [eas.address, validator.account.address],
      {client: {wallet: validator}}
    );
    buyResolver = await hre.viem.deployContract(
      "BuyCollateralResolver",
      [eas.address, trustedValidatorResolver.address]
    );
    sellResolver = await hre.viem.deployContract(
      "SellCollateralResolver",
      [eas.address, trustedValidatorResolver.address]
    );

    await trustedValidatorResolver.write.setBuyCollateralResolver([buyResolver.address]);
    await trustedValidatorResolver.write.setSellCollateralResolver([sellResolver.address]);

    let hash = await schemaRegistry.write.register([buySchema, buyResolver.address, true]);
    let receipt = await publicClient.waitForTransactionReceipt({ hash });
    buySchemaUID = receipt.logs[0].topics[1] as `0x${string}`;
    
    hash = await schemaRegistry.write.register([sellSchema, sellResolver.address, true]);
    receipt = await publicClient.waitForTransactionReceipt({ hash });
    sellSchemaUID = receipt.logs[0].topics[1] as `0x${string}`;
    console.log('sellSchemaUID', sellSchemaUID);
    hash = await schemaRegistry.write.register([validatorSchema, trustedValidatorResolver.address, true]);
    receipt = await publicClient.waitForTransactionReceipt({ hash });
    validatorSchemaUID = receipt.logs[0].topics[1] as `0x${string}`;
    console.log('validatorSchemaUID', validatorSchemaUID);





  }) 

  it("Buyer should deposit collateral", async function () {
    
    const eas = await hre.viem.getContractAt("IEAS", easAddress, { client: {wallet: buyer} });
    const buyMessage: BuyMessage = [
      {name: 'supplier', value: buyer.account.address, type: 'address'},
      {name: 'jobCost', value: 100n, type: 'uint256'},
      {name: 'creditsRequested', value: 100n, type: 'uint256'},
      {name: 'collateralRequested', value: 100n, type: 'uint256'},
      {name: 'validator', value: validator.account.address, type: 'address'},
      {name: 'offerDeadline', value: (await publicClient.getBlockNumber()) + 1800n, type: 'uint256'},
      {name: 'jobDeadline', value: (await publicClient.getBlockNumber()) + 3600n, type: 'uint256'},
      {name: 'arbitrationDeadline', value: (await publicClient.getBlockNumber()) + 7200n, type: 'uint256'}
    ]
    console.log('buyMessage', buyMessage)
    const buySchemaEncoder = new SchemaEncoder(buySchema)
    const encodedData = buySchemaEncoder.encodeData(buyMessage)
    const balance = await publicClient.getBalance({address: buyer.account.address})
    console.log('balance', balance)
    console.log('buySchemaUID', buySchemaUID)
    await eas.write.attest([
      { 
        schema: buySchemaUID,
        data: {
          recipient: buyer.account.address,
          expirationTime: NO_EXPIRATION,
          revocable: false,
          refUID: ZERO_BYTES32,
          data: encodedData as `0x${string}`,
          value: 100n
        }
      }
    ], {value: 100n})

  
    
    
    //expect(await lock.read.unlockTime()).to.equal(unlockTime);
  });

  it("Seller should reference buyers bid for them", async function () {

    //expect(await lock.read.owner()).to.equal(
    // getAddress(owner.account.address)
    //);
  });

  it("Validator should trigger and fill collateral accounts", async function () {
    /*
       expect(
       await publicClient.getBalance({
address: lock.address,
})
).to.equal(lockedAmount);
     */
  });

  it("Seller should be able to collect purchase price and collateral", async function () {
    // We don't use the fixture here because we want a different deployment
    /*
       const latestTime = BigInt(await time.latest());
       await expect(
       hre.viem.deployContract("Lock", [latestTime], {
value: 1n,
})
).to.be.rejectedWith("Unlock time should be in the future");
     */
  });
});
