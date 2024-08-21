import "dotenv/config";

import type { Producer, Consumer } from 'kafkajs';

import type { PublicClient, WalletClient  } from 'viem'
import { createWalletClient, createPublicClient, webSocket, getContract } from 'viem'
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

import EAS from './artifacts/EAS.json'
import SchemaRegistry from './artifacts/SchemaRegistry.json'
import  BuyCollateralResolver from './artifacts/baseSepolia/BuyCollateralResolver.json'
import  SellCollateralResolver from './artifacts/baseSepolia/SellCollateralResolver.json'
import  TrustedValidatorResolver from './artifacts/baseSepolia/TrustedValidatorResolver.json'

//import type { BuyStruct, BuyParams } from 'coophive-sdk'
import { Offer,BuyerMessage, SellerMessage } from './message-schema.ts';

import { 
  signOffchainBuyMessage,
  verifyOffchainBuyMessage,
} from 'coophive-sdk'
export class Client {
  publicClient: PublicClient;
  walletClient: WalletClient;

  buyCollateralResolver: any;
  sellCollateralResolver: any;
  validatorCollateralResolver: any;

  producer: Producer;
  consumer: Consumer;

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
    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: webSocket(rpcUrl),
    });
    this.walletClient = createWalletClient({
      account: privateKeyToAccount(privateKey),
      chain: baseSepolia,
      transport: webSocket(rpcUrl),
    });

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

    this.consumer = consumer;
  }

  async proposeBuy(offer: BuyerMessage): Promise<void> {
    this.producer.connect();
    try {
      const offchainAttestation = await signOffchainBuyMessage(
        EAS.addressBaseSepolia,
        this.walletClient,
        offer
      )

      await this.producer.send({
        topic: 'buyer-offers',
        messages: [{ value: JSON.stringify( offchainAttestation) }],
      })
      console.log('offer sent', offer)

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
      
    } catch (e) {
      console.error(e);
    }
    
  }
}
