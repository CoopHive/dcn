import "dotenv/config";
import {describe, expect, test} from '@jest/globals';
import { fileURLToPath  } from 'url';
import * as path from 'node:path'
import { Client } from '../src/Client'

import * as MockERC20 from '../src/artifacts/baseSepolia/ERC20Mock.json'

import type { BuyerAttest } from '../src/message-schema';
//import { producer, consumer } from '../src/kafka-config'
//
//import { Kafka } from 'kafkajs';
//import type { BuyStruct } from 'coophive-sdk';
describe("proposeDeal", async  () => {
  test("negotiates deal over kafka", async () => {
    /*
    const kafka = new Kafka({
      clientId: 'my-app',
      brokers: ['localhost:9092']
    })
   */
    if (!process.env.PRIVATE_KEY_BUYER || !process.env.PRIVATE_KEY_SELLER) {
      throw new Error("Please set PRIVATE_KEY_BUYER and PRIVATE_KEY_SELLER env variable")
    }
    const buyersClient = await new Client({
      isBuyer: true,
      rpcUrl: `https://site1.moralis-nodes.com/base-sepolia/${process.env.MORALIS}`,
      //rpcUrl: `http://127.0.0.1:8545`,
      redisUrl: `redis://127.0.0.1:6379`,
      privateKey: process.env.PRIVATE_KEY_BUYER as `0x${string}`,
    })
    
    const sellersClient = await new Client({
      isBuyer: false,
      rpcUrl: `https://site1.moralis-nodes.com/base-sepolia/${process.env.MORALIS}`,
      //rpcUrl: `http://127.0.0.1:8545`,
      redisUrl: `redis://127.0.0.1:6379`,
      privateKey: process.env.PRIVATE_KEY_SELLER as `0x${string}`,
    })
    console.log('buyer', buyersClient.account.address)
    console.log('seller', sellersClient.account.address)

    await buyersClient.listenForOffers()
    await sellersClient.listenForOffers()

    const offer: any = {
            supplier: sellersClient.account.address, 
            jobCost: 100n,
            paymentToken: MockERC20.address,
            image: 'grycap/cowsay:latest',
            prompt: 'hello coophive',
            collateralRequested: 100n,
            offerDeadline: (await buyersClient.publicClient.getBlockNumber()) + 1800n,
            jobDeadline: (await buyersClient.publicClient.getBlockNumber()) + 3600n,
            arbitrationDeadline: (await buyersClient.publicClient.getBlockNumber()) + 7200n
      }

    await buyersClient.offer(offer)
    // new promise wait for 10 seconds
    await new Promise(resolve => setTimeout(resolve, 10000));

    
  })


})
