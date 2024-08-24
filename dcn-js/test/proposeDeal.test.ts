import "dotenv/config";
import {describe, expect, test} from '@jest/globals';
import { fileURLToPath  } from 'url';
import * as path from 'node:path'
import { Client } from '../src/Client'

import * as MockERC20 from '../src/artifacts/baseSepolia/ERC20Mock.json'

import { producer, consumer } from '../src/kafka-config'
import type { BuyerAttest } from '../src/message-schema';
//import type { BuyStruct } from 'coophive-sdk';
describe("proposeDeal",  () => {
  test("", async () => {
    if (!process.env.PRIVATE_KEY) {
      throw new Error("Please set PRIVATE_KEY env variable")
    }
    const client = new Client({
      rpcUrl: `https://site1.moralis-nodes.com/base-sepolia/${process.env.MORALIS}`,
      //rpcUrl: `http://127.0.0.1:8545`,
      privateKey: process.env.PRIVATE_KEY as `0x${string}`,
      producer,
      consumer
    })

    const offer: any = {
            supplier: client.account.address, 
            jobCost: 100n,
            paymentToken: MockERC20.address,
            image: 'grycap/cowsay:latest',
            prompt: 'hello coophive',
            collateralRequested: 100n,
            offerDeadline: (await client.publicClient.getBlockNumber()) + 1800n,
            jobDeadline: (await client.publicClient.getBlockNumber()) + 3600n,
            arbitrationDeadline: (await client.publicClient.getBlockNumber()) + 7200n
      }

    await client.proposeDeal(offer)
  })


})
