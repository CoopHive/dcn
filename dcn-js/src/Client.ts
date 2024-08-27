import "dotenv/config";

import redis from 'redis'
import { Wallet, getDefaultProvider, JsonRpcProvider, BrowserProvider  } from 'ethers';
import { JsonRpcSigner } from 'ethers';
//import type { Producer, Consumer } from 'kafkajs';

import type { PrivateKeyAccount, PublicClient, WalletClient  } from 'viem'
import { createWalletClient, createPublicClient, http, webSocket, getContract, publicActions, custom, decodeAbiParameters } from 'viem'
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

import * as EAS from './artifacts/EAS.json'
import * as ERC20Mock from './artifacts/baseSepolia/ERC20Mock.json'
import * as SchemaRegistry from './artifacts/SchemaRegistry.json'
import * as  BuyCollateralResolver from './artifacts/baseSepolia/BuyCollateralResolver.json'
import* as SellCollateralResolver from './artifacts/baseSepolia/SellCollateralResolver.json'
import * as  TrustedValidatorResolver from './artifacts/baseSepolia/TrustedValidatorResolver.json'

//import type { BuyStruct, BuyParams, BuyData } from 'coophive-sdk'
import type { BuyerMessage, SellerMessage } from './message-schema';
import type { BuyerAttest } from './message-schema.ts';

import {
  createBuyAttestation,
  buyAbi,
  signOffchainBuyMessage,
  verifyOffchainBuyMessage,
  attestBuyMessage,
  attestSellMessage,
  createValidationAttestation

} from 'coophive-sdk'

import { runJob } from './job-runner'

export enum AgentType {
  BUYER = 'buyer',
  SELLER = 'seller',
  VALIDATOR = 'validator'
}

export class Client {
  role: AgentType;
  privateKey: `0x${string}`
  account: PrivateKeyAccount;
  publicClient: PublicClient;
  walletClient: WalletClient;

  eas: any;
  erc20: any;
  buyCollateralResolver: any;
  sellCollateralResolver: any;
  validatorCollateralResolver: any;

  publisher: any;
  subscriber: any;
  //producer: Producer;
  //consumer: Consumer;

  buyerSchemaUID: `0x${string}` = '0x7674c84acee890ef03bdbe281853efce9a10afe427dbfb203577ff3137bd0349'
  validatorSchemaUID: `0x${string}` = '0xf91e3931e3cf85fc255a403e5ccec30d9d05fa7612ccad90eb9297d52d490979'
  sellerSchemaUID: `0x${string}` = '0x4d2b0cd74e4002985777098314337ba532d5784c745a6486c852753dbe7f262e' 


  constructor({
    role,
    privateKey,
    rpcUrl,
    redisUrl
    //producer,
    //consumer
  }: {
    role: AgentType;
    rpcUrl: string;
    privateKey: `0x${string}`;
    redisUrl: string
  }) {

    return (async () => {
      this.role = role
      this.privateKey = privateKey;
      this.account = privateKeyToAccount(this.privateKey);
      this.publicClient = createPublicClient({
        //account: this.account,
        chain: baseSepolia,
        transport: http(rpcUrl),
      });
      this.walletClient = createWalletClient({
        account: this.account,
        chain: baseSepolia,
        transport: http(rpcUrl),
      })

      this.eas = getContract({
        address: EAS.addressBaseSepolia as `0x${string}`,
        abi: EAS.abi,
        client: {wallet: this.walletClient, public: this.publicClient}
      })

      this.erc20 = getContract({
        address: ERC20Mock.address as `0x${string}`,
        abi: ERC20Mock.abi,
        client: {wallet: this.walletClient}
      })

      this.buyCollateralResolver = getContract({
        address: BuyCollateralResolver.address as `0x${string}`,
        abi: BuyCollateralResolver.abi,
        client: {wallet: this.walletClient}
      })

      this.sellCollateralResolver = getContract({
        address: SellCollateralResolver.address as `0x${string}`,
        abi: SellCollateralResolver.abi,
        client: {wallet: this.walletClient}
      })

      this.validatorCollateralResolver = getContract({
        address: TrustedValidatorResolver.address as `0x${string}`,
        abi: TrustedValidatorResolver.abi,
        client: {wallet: this.walletClient}
      })

      this.publisher = await redis.createClient({
        url: redisUrl
      });

      await this.publisher.connect();
      this.subscriber = await redis.createClient({
        url: redisUrl
      });

      await this.subscriber.connect();

      return this
    })();
  }

  async offer(buyData: any): Promise<void> {
    console.log("offering" )
    try {
      const offchainAttestation = await signOffchainBuyMessage(
        EAS.addressBaseSepolia,
        this.privateKey,
        this.walletClient,
        {
          schemaUID: this.buyerSchemaUID,
          demander: this.account.address,
          data: buyData
        }
      )
      console.log('broadcasting offer from', this.account.address)
      this.publisher.publish('offers', JSON.stringify({tag:'offer', offchainAttestation}, (key, value) => {
        return typeof value === 'bigint' ? value.toString() : value 
      }))
    } catch (e) {
      console.error(e);
    }
  }

  async counterOffer(message:any): Promise<void> {
    console.log('counter offering')
    const isVerified = await verifyOffchainBuyMessage(
      EAS.addressBaseSepolia,
      this.walletClient,
      message.offchainAttestation.message.recipient,
      message.offchainAttestation
    )
    console.log('isVerified', isVerified)
    const offerData = decodeAbiParameters(buyAbi, message.offchainAttestation.message.data)
    if (isVerified) {
      const offer: any = {
        supplier: this.account.address,
        jobCost: 200n,
        paymentToken: ERC20Mock.address,
        image: 'grycap/cowsay:latest',
        prompt: 'hello coophive',
        collateralRequested: 50n,
        offerDeadline: (await this.publicClient.getBlockNumber()) + 1800n,
        jobDeadline: (await this.publicClient.getBlockNumber()) + 3600n,
        arbitrationDeadline: (await this.publicClient.getBlockNumber()) + 7200n
      }
      const offchainAttestation = await signOffchainBuyMessage(
        EAS.addressBaseSepolia,
        this.privateKey,
        this.walletClient,
        {
          schemaUID: this.buyerSchemaUID,
          demander: this.account.address,
          data: offer
        } 
      )

      this.subscriber.subscribe(`offers/${message.offchainAttestation.message.recipient}`, async (message) => {
        message = JSON.parse(message.toString())
        switch (message.tag) {
          case 'finalize':
            this.collateralizeAndRunJob(message)
          break
        }
      })

      this.publisher.publish(`offers/${message.offchainAttestation.message.recipient}`, JSON.stringify({tag:'counteroffer', offchainAttestation}, (key,value) => {
        return typeof value === 'bigint' ? value.toString() : value 
      }))

    }
  }


  async finalizeDeal(message:any) {
    console.log('finalizing deal')
    const offerData = decodeAbiParameters(buyAbi, message.offchainAttestation.message.data)
    const isVerified = await verifyOffchainBuyMessage(
      EAS.addressBaseSepolia,
      this.walletClient,
      message.offchainAttestation.message.recipient,
      message.offchainAttestation
    )
    const approve = await this.erc20.write.approve([this.buyCollateralResolver.address, offerData[1]]);
    const receipt = await this.publicClient.waitForTransactionReceipt({
      hash: approve
    })

    if (isVerified) {
      const finalOffer: any = {
        supplier: offerData[0],
        jobCost: offerData[1],
        paymentToken: offerData[2],
        image: offerData[3],
        prompt: offerData[4],
        collateralRequested: offerData[5],
        offerDeadline: offerData[6],
        jobDeadline: offerData[7],
        arbitrationDeadline: offerData[8]
      }

      const hash = await this.eas.write.attest([
        createBuyAttestation({
          schemaUID: this.buyerSchemaUID,
          demander: this.account.address,
          data: finalOffer
        })
      ])
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash
      })
      console.log('receipt', receipt)
      /*
      console.log('final offer', finalOffer)
      
      const tx = await attestBuyMessage(
        EAS.addressBaseSepolia,
        this.walletClient,
        {
          schemaUID: this.buyerSchemaUID,
          demander: this.account.address,
          data: finalOffer
        }
      )
      const receipt = await tx.wait()
     */
      this.publisher.publish(`offers/${this.account.address}`, JSON.stringify({tag: 'finalize', offer:finalOffer, receipt: receipt}, (key, value) => {
        return typeof value === 'bigint' ? value.toString() : value
      }))
    }
  }

  async collateralizeAndRunJob(message:any) {
    console.log('collateralizing and running job')
    try {
      console.log(this.eas.read)
      const buyerAttestation = await this.eas.read.getAttestation([message.receipt.logs[0].topics[1]])
      const approve = await this.erc20.write.approve([this.sellCollateralResolver.address, buyerAttestation.collateral]);
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: approve
      })

      const tx = await attestSellMessage(
        EAS.addressBaseSepolia,
        this.walletClient,
        {
          schemaUID: this.sellerSchemaUID,
          demander: this.account.address,
          data: {
            collateral: buyerAttestation.collateral,
          }
        }
      )
      const attestReceipt = await tx.wait()
      this.publisher.publish('validation-requests', JSON.stringify({tag: 'request', deal:buyerAttestation, receipt: receipt}))
    } catch (e) {
      console.log(e)
      return e
    }
  }

  async requestValidation(results:any) {
    console.log('requesting validation')
    try {
      this.publisher.publish('validation-requests', results)    
    }  catch (e) {
      console.log(e)
      return e
    }
  }

  async validateJob(results:any) {
    console.log('validating job')
    try {
      const tx = await createValidationAttestation(
        this.validatorSchemaUID,
        this.account.address,
        true,
        results.sellRefUID
      )
      await tx.wait()
      this.publisher.publish(`offers/${results.buyerAddress}`, JSON.stringify({validated:true}))
    } catch (e) {
      console.log(e)
      return e
    }
  }


  async listen() {
    switch (this.role) {
      case (AgentType.BUYER):
        this.subscriber.subscribe(`offers/${this.account.address}`, async (message) => {
        message = JSON.parse(message.toString())
        switch (message.tag) {
          case 'counteroffer':
            this.finalizeDeal(message)
          break;
          case 'results':
            this.requestValidation(message)
        }
      })
      break;
      case (AgentType.SELLER):
        this.subscriber.subscribe('offers', async (message) => {
        message = JSON.parse(message.toString())
        switch (message.tag) {
          case 'offer':
            this.counterOffer(message);
          break;
        }
      })
      /*
      this.subscriber.subscribe(`offers/${this.account.address}`, async (message) => {
        message = JSON.parse(message.toString())
        switch (message.tag) {
          case 'deal':
            await this.collateralizeAndRunJob(message)
        }
      })
     */
      break;
      case (AgentType.VALIDATOR):
        this.subscriber.subscribe('validation-requests', async (message) => {
        message = JSON.parse(message.toString())
        switch (message.tag) {
          case 'request':
            this.validateJob(message)
          break
        }
      })
    }
  }

}
