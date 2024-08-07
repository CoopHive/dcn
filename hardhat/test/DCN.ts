import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseGwei, getContract } from "viem";
import { WalletClient  } from "@nomicfoundation/hardhat-viem/types";
import EAS from '../external/EAS.json';


type BuyMessage  = {
  supplier: string,
  jobCost: bigint,
  creditsRequested: bigint,
  collateralRequested: bigint,
  validator: string,
  offerDeadline: bigint,
  jobDeadline: bigint,
  arbitrationDeadline: bigint
}

describe("DCN6", function () {
  let deployer: WalletClient;

  let buyer: WalletClient;
  let seller: WalletClient;
  let validator: WalletClient;

  const easAddress: `0x${string}` = '0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587'
  const schemaRegistryAddress: `0x${string}` = '0xA7b39296258348C78294F95B872b282326A97BDF'
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

  beforeEach(async () => {
    const publicClient = await hre.viem.getPublicClient();
    [deployer, buyer, seller, validator] = await hre.viem.getWalletClients();
    const schemaRegistry = await hre.viem.getContractAt("ISchemaRegistry", schemaRegistryAddress);
    const eas = await hre.viem.getContractAt("IEAS", easAddress);

    /*
    eas = await getContract({
      abi: EAS.abi,
      address: EAS.address as `0x${string}`,
   })
  */
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

    buySchemaUID = await schemaRegistry.write.register([buySchema, buyResolver.address, true]);

    sellSchemaUID = await schemaRegistry.write.register([sellSchema, sellResolver.address, true]);

    validatorSchemaUID = await schemaRegistry.write.register([validatorSchema, trustedValidatorResolver.address, true]);



  }) 

  it("Buyer should deposit collateral", async function () {
    console.log(eas.write.attest)
    const eas = await hre.viem.getContractAt("IEAS", easAddress, { client: {wallet: buyer} });

    const buyMessage: BuyMessage = {
      supplier: buyer.account.address,
      jobCost: 1n,
      creditsRequested: 1n,
      collateralRequested: 1n,
      validator: validator.account.address,
      offerDeadline: 1n,
      jobDeadline: 1n,
      arbitrationDeadline: 1n
    }
    
    
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
