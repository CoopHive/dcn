import "dotenv/config";
import {describe, expect, test} from '@jest/globals';
import { fileURLToPath  } from 'url';
import * as path from 'node:path'
import { Client } from '../src/Client'

import * as MockERC20 from '../src/artifacts/baseSepolia/ERC20Mock.json'

import { producer, consumer } from '../src/kafka-config'
import type { BuyerAttest } from '../src/message-schema';
//import type { BuyStruct } from 'coophive-sdk';
describe("proposeDeal", async  () => {
  test("can use client to send an offchain attestation over buyer-offers", async () => {
    if (!process.env.PRIVATE_KEY_BUYER || !process.env.PRIVATE_KEY_SELLER) {
      throw new Error("Please set PRIVATE_KEY_BUYER and PRIVATE_KEY_SELLER env variable")
    }
    const buyersClient = await new Client({
      //rpcUrl: `https://site1.moralis-nodes.com/base-sepolia/${process.env.MORALIS}`,
      rpcUrl: `http://127.0.0.1:8545`,
      privateKey: process.env.PRIVATE_KEY_BUYER as `0x${string}`,
      producer,
      consumer
    })
    
    const sellersClient = await new Client({
      //rpcUrl: `https://site1.moralis-nodes.com/base-sepolia/${process.env.MORALIS}`,
      rpcUrl: `http://127.0.0.1:8545`,
      privateKey: process.env.PRIVATE_KEY_SELLER as `0x${string}`,
      producer,
      consumer
    })
    console.log(buyersClient.account.address)

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
