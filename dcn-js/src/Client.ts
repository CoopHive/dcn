// @ts-nocheck
import "dotenv/config";
import { fileURLToPath  } from 'url';
import { readFileSync } from 'node:fs'
import { stringify } from 'yaml'
import yaml from 'js-yaml'
import * as path from 'node:path'

import redis from 'redis'

import { Wallet, getDefaultProvider, JsonRpcProvider, BrowserProvider  } from 'ethers';
import { JsonRpcSigner } from 'ethers';

import type { PrivateKeyAccount, PublicClient, WalletClient  } from 'viem'
import {
  createWalletClient,
  createPublicClient,
  http,
  webSocket,
  getContract,
  publicActions,
  custom,
  decodeAbiParameters,
  parseEventLogs
} from 'viem'
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

import  EAS from './artifacts/EAS.json'
import ERC20Mock from './artifacts/baseSepolia/ERC20Mock.json'
console.log('erc20', ERC20Mock)
import  SchemaRegistry from './artifacts/SchemaRegistry.json'
import   BuyCollateralResolver from './artifacts/baseSepolia/BuyCollateralResolver.json'
import SellCollateralResolver from './artifacts/baseSepolia/SellCollateralResolver.json'
import   TrustedValidatorResolver from './artifacts/baseSepolia/TrustedValidatorResolver.json'

import type { BuyStruct } from './attestation-utils/buy'
import { createValidationAttestation } from './attestation-utils/validation'
import { createSellAttestation } from './attestation-utils/sell'
import { createBuyAttestation, parseBuyAbi, signOffchainBuyMessage, verifyOffchainBuyMessage } from './attestation-utils/buy'

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

  async offer(offer: BuyStruct, job: any): Promise<void> {
    console.log('*** OFFERING ***')
    console.log(`${this.role} is offering ${Number(offer.jobCost)} for ${offer.image} by creating an EAS offchain attestation`)
    try {
      console.log('offer', offer)
      const offchainAttestation = await signOffchainBuyMessage(
        EAS.addressBaseSepolia as `0x${string}`,
        this.privateKey,
        this.walletClient,
        {
          schemaUID: this.buyerSchemaUID,
          demander: this.account.address,
          data: offer
        }
      )
      console.log('offchain attestation', offchainAttestation)
      this.publisher.publish('offers', JSON.stringify({tag:'offer', offchainAttestation, job}, (key, value) => {
        return typeof value === 'bigint' ? value.toString() : value 
      }))
    } catch (e) {
      console.error(e);
    }
    console.log('*** END OFFERING ***')
  }

  async counterOffer({offchainAttestation, job}): Promise<void> {
    console.log('*** COUNTEROFFERING ***')
    console.log(`${this.role} is responding to the job offer, first by verifying the job offer is legitimate by verifying the EAS offchain attestation`)

    const isVerified = await verifyOffchainBuyMessage(
      EAS.addressBaseSepolia as `0x${string}`,
      this.walletClient,
      offchainAttestation.message.recipient,
      offchainAttestation
    )
    console.log(`the offchain attestation is ${isVerified ? 'valid' : 'invalid'}`)
    const offerData = parseBuyAbi(offchainAttestation.message.data)
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
      console.log(`${this.role} is counter-offering ${Number(offer.jobCost)} for ${offer.image} by creating an EAS offchain attestation`)
      const sellerOffchainAttestation = await signOffchainBuyMessage(
        EAS.addressBaseSepolia as `0x${string}`,
        this.privateKey,
        this.walletClient,
        {
          schemaUID: this.buyerSchemaUID,
          demander: this.account.address,
          data: offer
        } 
      )
      console.log(`${this.role} is now listening and publishing to offers/`, offchainAttestation.message.recipient)
      this.subscriber.subscribe(`offers/${offchainAttestation.message.recipient}`, async (message) => {
        message = JSON.parse(message.toString())
        switch (message.tag) {
          case 'finalize':
            this.collateralizeAndRunJob(message)
          break
        }
      })
      console.log('publishing to offers/', offchainAttestation.message.recipient)
      this.publisher.publish(`offers/${offchainAttestation.message.recipient}`, JSON.stringify({tag:'counteroffer', offchainAttestation:sellerOffchainAttestation, job}, (key,value) => {
        return typeof value === 'bigint' ? value.toString() : value 
      }))

    }
    console.log('*** END COUNTEROFFERING ***')
  }


  async finalizeDeal({offchainAttestation, job}) {
    console.log(`*** FINALIZING DEAL ***`)
    console.log(`${this.role} is responding to the counteroffer, first by verifying the job offer is legitimate by verifying the EAS offchain attestation`)
    const finalOffer = parseBuyAbi(offchainAttestation.message.data)
    const isVerified = await verifyOffchainBuyMessage(
      EAS.addressBaseSepolia,
      this.walletClient,
      offchainAttestation.message.recipient,
      offchainAttestation
    )
    console.log(`the offchain attestation is ${isVerified ? 'valid' : 'invalid'}`)
    console.log(`approving the tokens to be pulled by the buyCollateralResolver on eas.attest`)
    const approve = await this.erc20.write.approve([this.buyCollateralResolver.address, finalOffer.jobCost]);
    const receipt = await this.publicClient.waitForTransactionReceipt({
      hash: approve
    })

    if (isVerified) {
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
      console.log(`the attestation hash is ${hash} and attestation uid is ${receipt.logs[0].data}`)
      console.log(`${this.role} is now listening and publishing to offers/`, this.account.address)
      this.publisher.publish(`offers/${this.account.address}`, JSON.stringify({tag: 'finalize', offer:finalOffer, receipt: receipt, job}, (key, value) => {
        return typeof value === 'bigint' ? value.toString() : value
      }))
    }
    console.log('*** END FINALIZING DEAL ***')
  }

  async collateralizeAndRunJob({receipt, job}) {
    console.log(`*** COLLATERALIZING AND RUNNING JOB ***`)
    console.log(`${this.role} is checking the buyer attestation existence and will deposit the collateral requested and run the job`)
    try {
      /*
      const logs = parseEventLogs({
        abi: EAS.abi,
        logs: message.receipt.logs
      })
      console.log('logs', logs)
     */
      const buyAttestationUID = receipt.logs[0].data
      //console.log('logs[0].args.uid', logs[0].args.uid)
      const buyerAttestation = await this.eas.read.getAttestation([buyAttestationUID])
      console.log('buyer attestation exists!:  ', buyerAttestation)
      const parsedBuyerAttestationData = parseBuyAbi(buyerAttestation.data)
      console.log(`approving the tokens to be pulled by the sellCollateralResolver on eas.attest`)
      const approve = await this.erc20.write.approve([this.sellCollateralResolver.address, parsedBuyerAttestationData.collateralRequested]);
      let approveReceipt = await this.publicClient.waitForTransactionReceipt({
        hash: approve
      })

      const hash = await this.eas.write.attest([
        createSellAttestation({
          schemaUID: this.sellerSchemaUID,
          seller: this.account.address,
          collateral: parsedBuyerAttestationData.collateralRequested,
          buyRefUID: receipt.logs[0].data
        })
      ])
      const attestReceipt = await this.publicClient.waitForTransactionReceipt({
        hash
      })

      console.log(`the attestation hash is ${hash} and attestation uid is ${attestReceipt.logs[0].data}`)
      console.log(`${this.role} is now running the job`)
      const stuff = await runJob(stringify(yaml.dump(job)))
      console.log(`publishing to offers/${buyerAttestation.attester}`)
      this.publisher.publish(`offers/${buyerAttestation.attester}`, JSON.stringify({tag: 'results', results:stuff}, (key, value) => {
        return typeof value === 'bigint' ? value.toString() : value
      }))
      console.log(`job results complete, sending to validator for validation`)
      this.publisher.publish('validation-requests', JSON.stringify({tag: 'request', receipt: attestReceipt, buyerAddress: buyerAttestation.attester}, (key, value) => {
        return typeof value === 'bigint' ? value.toString() : value
      }))
    } catch (e) {
      console.log(e)
      return e
    }
    console.log('*** END COLLATERALIZING AND RUNNING JOB ***')
  }
  /*
     async requestValidation(results:any) {
     console.log('requesting validation')
     try {
     this.publisher.publish('validation-requests', results)    
     }  catch (e) {
     console.log(e)
     return e
     }
     }
   */

  async validateJob({receipt, buyerAddress}) {
    console.log('*** VALIDATING ***')
    console.log(`${this.role} is checking the output of the job to ensure correctness and then creating an attestation, to delegate the deposited collateral correctly`)
    try {
      const hash = await this.eas.write.attest([
        createValidationAttestation({
          schemaUID: this.validatorSchemaUID,
          validator: this.account.address,
          isApproved: true,
          sellRefUID: receipt.logs[0].data
        })
      ])
      const validationReceipt = await this.publicClient.waitForTransactionReceipt({
        hash
      })
      console.log(`the attestation hash is ${hash} and attestation uid is ${validationReceipt.logs[0].data}`)
      console.log(`${this.role} is now listening and publishing to offers/`, buyerAddress)
      
      this.publisher.publish(`offers/${buyerAddress}`, JSON.stringify({tag:'results', validated:true}))
    } catch (e) {
      console.log(e)
      return e
    }
    console.log('*** END VALIDATING ***')
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
            console.log('results-message', message)
          //this.requestValidation(message)
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
