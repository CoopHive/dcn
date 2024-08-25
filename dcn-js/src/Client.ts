import "dotenv/config";
import { Wallet, getDefaultProvider, JsonRpcProvider, BrowserProvider  } from 'ethers';
import { JsonRpcSigner } from 'ethers';
import type { Producer, Consumer } from 'kafkajs';

import type { PrivateKeyAccount, PublicClient, WalletClient  } from 'viem'
import { createWalletClient, createPublicClient, http, webSocket, getContract, publicActions, custom, decodeAbiParameters } from 'viem'
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

import * as EAS from './artifacts/EAS.json'
import * as SchemaRegistry from './artifacts/SchemaRegistry.json'
import * as  BuyCollateralResolver from './artifacts/baseSepolia/BuyCollateralResolver.json'
import* as SellCollateralResolver from './artifacts/baseSepolia/SellCollateralResolver.json'
import * as  TrustedValidatorResolver from './artifacts/baseSepolia/TrustedValidatorResolver.json'

//import type { BuyStruct, BuyParams, BuyData } from 'coophive-sdk'
import type { BuyerMessage, SellerMessage } from './message-schema';
import type { BuyerAttest } from './message-schema.ts';

import {
  buyAbi,
  signOffchainBuyMessage,
  verifyOffchainBuyMessage,
  attestBuyMessage

} from 'coophive-sdk'


export class Client {
  privateKey: `0x${string}`
  account: PrivateKeyAccount;
  publicClient: PublicClient;
  walletClient: WalletClient;

  buyCollateralResolver: any;
  sellCollateralResolver: any;
  validatorCollateralResolver: any;

  producer: Producer;
  consumer: Consumer;

  buyerSchemaUID: `0x${string}` = '0x7674c84acee890ef03bdbe281853efce9a10afe427dbfb203577ff3137bd0349'
  validatorSchemaUID: `0x${string}` = '0xf91e3931e3cf85fc255a403e5ccec30d9d05fa7612ccad90eb9297d52d490979'
  sellerSchemaUID: `0x${string}` = '0x4d2b0cd74e4002985777098314337ba532d5784c745a6486c852753dbe7f262e' 


  constructor({
    privateKey,
    rpcUrl,
    producer,
    consumer
  }: {
    rpcUrl: string;
    privateKey: `0x${string}`;
    producer: Producer;
    consumer: Consumer;
  }) {

    return (async () => {
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

      this.producer = producer;
      this.producer.connect();

      this.consumer = consumer;
      this.consumer.connect();
      await this.consumer.subscribe({ topic: 'buyer-offers', fromBeginning: true })
      return this
    })();
  }

  async offer(buyData: any): Promise<void> {
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
      await this.producer.send({
        topic: 'buyer-offers',
        messages: [{ value: JSON.stringify(offchainAttestation, (key, value) => {
          return typeof value === 'bigint' ? value.toString() : value
        }) }],
      })
      /*
         if (offer.responseTopic) {
         await this.consumer.connect()
         await this.consumer.subscribe({ topic: offer.responseTopic, fromBeginning: true })

         await this.consumer.run({
eachMessage: async ({ message }) => {
if (!message.value) {
console.error('Received message with null value')
return
}
const response: SellerMessage = JSON.parse(message.value.toString())
console.log('Received seller response:', response)
const buyerAttest: BuyerAttest = getOffer(response.offerId)

try {
const isValid = await verifyOffchainBuyMessage(
EAS.addressBaseSepolia,
this.walletClient,
buyerAttest.offer.buyParams.demander,
buyerAttest.offchainAttestation,
)

if (isValid) {

      // TODO: negotiate new paramets or accept
      }
      } catch (e) {
      console.error(e)  
      }


      if (response._tag === 'attest' && 'result' in response) {
      await this.consumer.disconnect()
      await this.producer.disconnect()
      console.log('Deal finalized. Disconnected from Kafka.')
      }
      }
      })
      }

       */
    } catch (e) {
      console.error(e);
    }
  }


  async listenForOffers() {

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        console.log('hello !')
        console.log('responding as', this.account.address)
        if (!message.value) {
          console.error('Received message with null value');
          return;
        }

        const offer = JSON.parse(message.value.toString())

        const isVerified = await verifyOffchainBuyMessage(
          EAS.addressBaseSepolia,
          this.walletClient,
          offer.message.recipient,
          offer
        )
        console.log('is verified', isVerified)
        console.log('offer', offer)
        const offerData = decodeAbiParameters(buyAbi, offer.message.data)
        console.log('supplier', offerData[0])
        console.log('recipient', offer.message.recipient)
        if (isVerified) {
          // if supplier is this client and incoming attestation is not from it
          if (offerData[0] == this.account.address && offer.message.recipient != this.account.address) {
            console.log('counter offering')
            // this is an offer by which i'm supplying compute
            const counterOffer: any = {
              supplier: this.account.address,
              jobCost: 200n,
              paymentToken: EAS.addressBaseSepolia,
              image: 'grycap/cowsay:latest',
              prompt: 'hello coophive',
              collateralRequested: 50n,
              offerDeadline: (await this.publicClient.getBlockNumber()) + 1800n,
              jobDeadline: (await this.publicClient.getBlockNumber()) + 3600n,
              arbitrationDeadline: (await this.publicClient.getBlockNumber()) + 7200n
            }
            this.offer(counterOffer)
          // if supplier is not this client and incoming attestation is from it 
          } else if (offerData[0] != this.account.address) {

            console.log('accepting, attesting on chain')
            // this is an offer by which i'm receiving compute
            // auto accept counter offer
            console.log(offer)
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
            console.log('receipt', receipt)

          } else {
            // Not relevant to me
          }
        } else {
          // TODO: negotiate new paramets or reject
        }
      }
    })
  }
}
