import "dotenv/config";
import { Wallet, getDefaultProvider, JsonRpcProvider, BrowserProvider  } from 'ethers';
import { JsonRpcSigner } from 'ethers';
import type { Producer, Consumer } from 'kafkajs';

import type { PrivateKeyAccount, PublicClient, WalletClient  } from 'viem'
import { createWalletClient, createPublicClient, http, webSocket, getContract, publicActions, custom } from 'viem'
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
  ethersSignOffchainBuyMessage,
  signOffchainBuyMessage,
  verifyOffchainBuyMessage,

} from 'coophive-sdk'


export class Client {
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
      this.account = privateKeyToAccount(privateKey);

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

      this.consumer = consumer;

  }

  async proposeDeal(buyData: any): Promise<void> {
    this.producer.connect();
    try {
      const offchainAttestation = await signOffchainBuyMessage(
        EAS.addressBaseSepolia,
        process.env.PRIVATE_KEY as `0x${string}`,
        this.walletClient,
        {
          schemaUID: this.buyerSchemaUID,
          demander: this.account.address,
          data: buyData
        }
      )


      console.log('offchain', offchainAttestation)


      await this.producer.send({
        topic: 'buyer-offers',
        messages: [{ value: JSON.stringify( offchainAttestation) }],
      })
      console.log('offer sent', offchainAttestation)
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
}
