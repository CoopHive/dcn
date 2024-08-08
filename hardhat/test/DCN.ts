import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseGwei, getContract } from "viem";
import { WalletClient, PublicClient  } from "@nomicfoundation/hardhat-viem/types";
//import EASJson from '../external/EAS.json';
import { SchemaEncoder, NO_EXPIRATION, ZERO_ADDRESS, ZERO_BYTES32, getUID } from '@ethereum-attestation-service/eas-sdk';

type BuyMessage  = [
  supplier: {name: string, value: any, type: string},
  jobCost: {name: string, value: any, type: string},
  paymentToken: {name: string, value: any, type: string},
  creditsRequested: {name: string, value: any, type: string},
  collateralRequested: {name: string, value: any, type: string},
  validator: {name: string, value: any, type: string},
  offerDeadline: {name: string, value: any, type: string},
  jobDeadline: {name: string, value: any, type: string},
  arbitrationDeadline: {name: string, value: any, type: string}
]

type SellMessage = [
  collateral: {name: string, value: any, type: string},
  validator: {name: string, value: any, type: string}
]

describe("DCN6", function () {
  let publicClient: PublicClient;

  let deployer: WalletClient;

  let buyer: WalletClient;
  let seller: WalletClient;
  let validator: WalletClient;

  let erc20: any;
  let erc20Address: `0x${string}`;

  const easAddress: `0x${string}` = '0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587'
  const schemaRegistryAddress: `0x${string}` = '0xA7b39296258348C78294F95B872b282326A97BDF'

  let buyResolverAddress: `0x${string}`;
  let buySchema: string = "address supplier, uint256 jobCost, address paymentToken, uint256 creditsRequested, uint256 collateralRequested, address validator, uint256 offerDeadline, uint256 jobDeadline, uint256 arbitrationDeadline"  
  let buySchemaUID: `0x${string}`;


  let sellResolverAddress: `0x${string}`;
  let sellSchema: string = "uint256 collateral, address validator"
  let sellSchemaUID: `0x${string}`;

  let validatorSchema: string = "bool isApproved"
  let validatorSchemaUID: `0x${string}`;

  let buyAttestation: `0x${string}`;

  before(async () => {
    publicClient = await hre.viem.getPublicClient();
    [deployer, buyer, seller, validator] = await hre.viem.getWalletClients();
    // Mock ERC20
    erc20 = await hre.viem.deployContract("ERC20Mock", [], {client: {wallet: deployer}});
    erc20Address = erc20.address;
    
    // EAS
    const schemaRegistry = await hre.viem.getContractAt("ISchemaRegistry", schemaRegistryAddress);
    const eas = await hre.viem.getContractAt("IEAS", easAddress);

    const trustedValidatorResolver = await hre.viem.deployContract(
      "TrustedValidatorResolver",
      [eas.address, validator.account.address],
      {client: {wallet: validator}}
    );

    const buyResolver = await hre.viem.deployContract(
      "BuyCollateralResolver",
      [eas.address, trustedValidatorResolver.address]
    );
    buyResolverAddress = buyResolver.address;

    const sellResolver = await hre.viem.deployContract(
      "SellCollateralResolver",
      [eas.address, trustedValidatorResolver.address]
    );
    sellResolverAddress = sellResolver.address;

    await trustedValidatorResolver.write.setBuyCollateralResolver([buyResolver.address]);
    await trustedValidatorResolver.write.setSellCollateralResolver([sellResolver.address]);

    let hash = await schemaRegistry.write.register([buySchema, buyResolver.address, true]);
    let receipt = await publicClient.waitForTransactionReceipt({ hash });
    buySchemaUID = receipt.logs[0].topics[1] as `0x${string}`;
    console.log('buySchemaUID', buySchemaUID); 

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
    console.log(await publicClient.getBlockNumber())
    await erc20.write.mint([buyer.account.address, 100n]);

    const erc20Buyer = await hre.viem.getContractAt("IERC20", erc20.address, { client: {wallet: buyer} });
    await erc20Buyer.write.approve([buyResolverAddress, 100n]);

    const eas = await hre.viem.getContractAt("IEAS", easAddress, { client: {wallet: buyer} });
    const buyMessage: BuyMessage = [
      {name: 'supplier', value: buyer.account.address, type: 'address'},
      {name: 'jobCost', value: 100n, type: 'uint256'},
      {name: 'paymentToken', value: erc20.address, type: 'address'},
      {name: 'creditsRequested', value: 100n, type: 'uint256'},
      {name: 'collateralRequested', value: 100n, type: 'uint256'},
      {name: 'validator', value: validator.account.address, type: 'address'},
      {name: 'offerDeadline', value: (await publicClient.getBlockNumber()) + 1800n, type: 'uint256'},
      {name: 'jobDeadline', value: (await publicClient.getBlockNumber()) + 3600n, type: 'uint256'},
      {name: 'arbitrationDeadline', value: (await publicClient.getBlockNumber()) + 7200n, type: 'uint256'}
    ]
    const buySchemaEncoder = new SchemaEncoder(buySchema)
    const encodedData = buySchemaEncoder.encodeData(buyMessage)
    const balance = await publicClient.getBalance({address: buyer.account.address})
    const hash = await eas.write.attest([
      { 
        schema: buySchemaUID,
        data: {
          recipient: buyer.account.address,
          expirationTime: NO_EXPIRATION,
          revocable: false,
          refUID: ZERO_BYTES32,
          data: encodedData as `0x${string}`,
          value: 0n
        }
      }
    ])

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    buyAttestation = receipt.logs[0].data
     console.log('buyAttestation', buyAttestation)
    

   const attestation = await eas.read.getAttestation([buyAttestation])
   console.log('attestation', attestation)

    //expect(await lock.read.unlockTime()).to.equal(unlockTime);
  });

  it("Seller should reference buyers bid for them", async function () {
    console.log(await publicClient.getBlockNumber())
    await erc20.write.mint([seller.account.address, 100n]);
    
    const erc20Seller = await hre.viem.getContractAt("IERC20", erc20.address, { client: {wallet: seller} });
    await erc20Seller.write.approve([sellResolverAddress, 100n]);

    const eas = await hre.viem.getContractAt("IEAS", easAddress, { client: {wallet: seller} });
    const sellMessage: SellMessage = [
      {name: 'collateral', value: 100n, type: 'uint256'},
      {name: 'validator', value: validator.account.address, type: 'address'},
    ]
    console.log('sellMessage', sellMessage)

    const sellSchemaEncoder = new SchemaEncoder(sellSchema)
    const encodedData = sellSchemaEncoder.encodeData(sellMessage)

    await eas.write.attest([
      { 
        schema: sellSchemaUID,
        data: {
          recipient: seller.account.address,
          expirationTime: NO_EXPIRATION,
          revocable: true,
          refUID: buyAttestation,
          data: encodedData as `0x${string}`,
          value: 0n
        }
      }
    ])




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
