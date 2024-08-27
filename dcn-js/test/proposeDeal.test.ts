import "dotenv/config";
import {describe, expect, test} from '@jest/globals';
import { fileURLToPath  } from 'url';
import * as path from 'node:path'
import { Client, AgentType } from '../src/Client'
import { zeroAddress, getContract, createWalletClient, http, parseEther, createPublicClient  } from 'viem'
import { localhost, baseSepolia } from 'viem/chains'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import * as MockERC20 from '../src/artifacts/baseSepolia/ERC20Mock.json'

import type { BuyerAttest } from '../src/message-schema';
describe("proposeDeal", async  () => {
  test("negotiates deal over kafka", async () => {
    const rpcUrl = 'http://127.0.0.1:8545'
    //const rpcUrl = `https://site1.moralis-nodes.com/base-sepolia/${process.env.MORALIS}`
    /*
    const kafka = new Kafka({
      clientId: 'my-app',
      brokers: ['localhost:9092']
    })
   */
    if (!process.env.PRIVATE_KEY_BUYER || !process.env.PRIVATE_KEY_SELLER) {
      throw new Error("Please set PRIVATE_KEY_BUYER and PRIVATE_KEY_SELLER env variable")
    }

    const deployer = privateKeyToAccount(process.env.PRIVATE_KEY_BUYER as `0x${string}`)
    const walletClient = createWalletClient({
      account: deployer,  
      chain: baseSepolia,
      transport: http(rpcUrl),
    })
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl),
    })





    const erc20 = getContract({
      address: MockERC20.address as `0x${string}`, 
      abi: MockERC20.abi,
      client: {wallet: walletClient}
    })

    const buyersClient = await new Client({
      role:  AgentType.BUYER,
      rpcUrl,
      redisUrl: `redis://127.0.0.1:6379`,
      privateKey: process.env.PRIVATE_KEY_BUYER as `0x${string}`,
    })
    let hash =  await erc20.write.mint([buyersClient.account.address, parseEther('100')]);
    await publicClient.waitForTransactionReceipt({hash})
    
    const sellersClient = await new Client({
      role: AgentType.SELLER,
      rpcUrl,
      redisUrl: `redis://127.0.0.1:6379`,
      privateKey: process.env.PRIVATE_KEY_SELLER as `0x${string}`,
    })
    hash = await erc20.write.mint([sellersClient.account.address, parseEther('100')]);
    await publicClient.waitForTransactionReceipt({hash})
    const validatorClient = await new Client({
      role: AgentType.VALIDATOR,
      rpcUrl,
      redisUrl: `redis://127.0.0.1:6379`,
      privateKey: process.env.PRIVATE_KEY_VALIDATOR as `0x${string}`,
    })
    hash = await erc20.write.mint([validatorClient.account.address, parseEther('100')]);
    await publicClient.waitForTransactionReceipt({hash})
    console.log('buyer', buyersClient.account.address)
    console.log('seller', sellersClient.account.address)

    await buyersClient.listen()
    await sellersClient.listen()
    await validatorClient.listen()

    const offer: any = {
            supplier: zeroAddress, 
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
    await new Promise(resolve => setTimeout(resolve, 45000));

    
  })


})
