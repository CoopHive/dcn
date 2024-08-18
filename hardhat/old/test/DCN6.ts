import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseGwei, getContract } from "viem";
import { WalletClient, PublicClient  } from "@nomicfoundation/hardhat-viem/types";
//import EASJson from '../external/EAS.json';
import {
  SchemaEncoder,
  NO_EXPIRATION,
  ZERO_ADDRESS,
  ZERO_BYTES32,
  getUID,
  OffchainConfig,
  OffchainAttestationVersion,
  Offchain } from '@ethereum-attestation-service/eas-sdk';
import { 
  createBuyAttestation,
  createSellAttestation,
  createValidationAttestation,
  buySchema,
  sellSchema,
  validationSchema,
  signOffchainBuyMessage,
  verifyOffchainBuyMessage,
} from "coophive-sdk"

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
  let buySchemaUID: `0x${string}`;


  let sellResolverAddress: `0x${string}`;
  let sellSchemaUID: `0x${string}`;

  let validationSchemaUID: `0x${string}`;

  let buyAttestation: `0x${string}`;
  let sellAttestation: `0x${string}`;

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

    hash = await schemaRegistry.write.register([sellSchema, sellResolver.address, true]);
    receipt = await publicClient.waitForTransactionReceipt({ hash });
    sellSchemaUID = receipt.logs[0].topics[1] as `0x${string}`;

    hash = await schemaRegistry.write.register([validationSchema, trustedValidatorResolver.address, true]);
    receipt = await publicClient.waitForTransactionReceipt({ hash });
    validationSchemaUID = receipt.logs[0].topics[1] as `0x${string}`;


  }) 

  it("Buyer can create an offchain Buy message, seller can verify message", async function () {
    const offchainAttestation = await signOffchainBuyMessage(
      easAddress,
      buyer,
      {
        schemaUID: buySchemaUID,
        demander: buyer.account.address,
        data: {
          supplier: buyer.account.address, 
          jobCost: 100n,
          paymentToken: erc20.address,
          creditsRequested: 100n,
          collateralRequested: 100n,
          offerDeadline: (await publicClient.getBlockNumber()) + 1800n,
          jobDeadline: (await publicClient.getBlockNumber()) + 3600n,
          arbitrationDeadline: (await publicClient.getBlockNumber()) + 7200n
        }
      }
    )

    const verification = await verifyOffchainBuyMessage(
      easAddress,
      seller,
      buyer.account.address,
      offchainAttestation
    )

    console.log('verification', verification)
  })

  it("Buyer should deposit collateral", async function () {
    await erc20.write.mint([buyer.account.address, 100n]);

    const erc20Buyer = await hre.viem.getContractAt("IERC20", erc20.address, { client: {wallet: buyer} });
    await erc20Buyer.write.approve([buyResolverAddress, 100n]);

    const eas = await hre.viem.getContractAt("IEAS", easAddress, { client: {wallet: buyer} });

    const balance = await publicClient.getBalance({address: buyer.account.address})
    const hash = await eas.write.attest([
      createBuyAttestation({
        schemaUID: buySchemaUID,
        demander: buyer.account.address,
        data: {
          supplier: buyer.account.address, 
          jobCost: 100n,
          paymentToken: erc20.address,
          creditsRequested: 100n,
          collateralRequested: 100n,
          offerDeadline: (await publicClient.getBlockNumber()) + 1800n,
          jobDeadline: (await publicClient.getBlockNumber()) + 3600n,
          arbitrationDeadline: (await publicClient.getBlockNumber()) + 7200n
        }
      })
    ])

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    buyAttestation = receipt.logs[0].data


    const attestation = await eas.read.getAttestation([buyAttestation])

    //expect(await lock.read.unlockTime()).to.equal(unlockTime);
  });

  it("Seller should reference buyers bid for them", async function () {
    await erc20.write.mint([seller.account.address, 100n]);

    const erc20Seller = await hre.viem.getContractAt("IERC20", erc20.address, { client: {wallet: seller} });
    await erc20Seller.write.approve([sellResolverAddress, 100n]);

    const eas = await hre.viem.getContractAt("IEAS", easAddress, { client: {wallet: seller} });

    const hash = await eas.write.attest([
      createSellAttestation({
        schemaUID: sellSchemaUID,
        seller: seller.account.address,
        collateral: 100n,
        buyRefUID: buyAttestation
      })
    ])

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    sellAttestation = receipt.logs[0].data
  });

  it("Validator should trigger and fill collateral accounts", async function () {
    const eas = await hre.viem.getContractAt("IEAS", easAddress, { client: {wallet: validator} });
    await eas.write.attest([
      createValidationAttestation({
        schemaUID: validationSchemaUID,
        validator: validator.account.address,
        isApproved: true,
        sellRefUID: sellAttestation
      })
    ])
  });
});
