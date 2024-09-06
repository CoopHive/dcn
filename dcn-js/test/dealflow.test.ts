import "dotenv/config";
import {describe, expect, test} from '@jest/globals';

import { fileURLToPath  } from 'url';
import * as path from 'node:path'
import { readFileSync } from 'node:fs'
import { stringify } from 'yaml'
import yaml from 'js-yaml'

import { zeroAddress, getContract, createWalletClient, http, parseEther, createPublicClient  } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { localhost, baseSepolia } from 'viem/chains'

import MockERC20 from '../src/artifacts/baseSepolia/ERC20Mock.json'

import { Client, AgentType } from '../src/Client'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("proposeDeal", () => {
  test("Deal occurs over redis pubsub", async () => {
    const rpcUrl = 'http://127.0.0.1:8545'
    const redisUrl = `redis://127.0.0.1:6379`
    //const rpcUrl = `https://site1.moralis-nodes.com/base-sepolia/${process.env.MORALIS}`
    //const rpcUrl = `https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`
    if (!process.env.PRIVATE_KEY_BUYER && !process.env.PRIVATE_KEY_SELLER && !process.env.PRIVATE_KEY_VALIDATOR) {
      throw new Error("Please set PRIVATE_KEY_BUYER and PRIVATE_KEY_SELLER and PRIVATE_KEY_VALIDATOR env variable")
    }

    const minter = privateKeyToAccount(process.env.PRIVATE_KEY_BUYER as `0x${string}`)
    const walletClient = createWalletClient({
      account: minter,  
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
      redisUrl,
      privateKey: process.env.PRIVATE_KEY_BUYER as `0x${string}`,
    })
    let hash =  await erc20.write.mint([buyersClient.account.address, parseEther('100')]);
    await publicClient.waitForTransactionReceipt({hash})
    await buyersClient.listen()

    const sellersClient = await new Client({
      role: AgentType.SELLER,
      rpcUrl,
      redisUrl,
      privateKey: process.env.PRIVATE_KEY_SELLER as `0x${string}`,
    })
    hash = await erc20.write.mint([sellersClient.account.address, parseEther('100')]);
    await publicClient.waitForTransactionReceipt({hash})
    await sellersClient.listen()

    const validatorClient = await new Client({
      role: AgentType.VALIDATOR,
      rpcUrl,
      redisUrl,
      privateKey: process.env.PRIVATE_KEY_VALIDATOR as `0x${string}`,
    })
    hash = await erc20.write.mint([validatorClient.account.address, parseEther('100')]);
    await publicClient.waitForTransactionReceipt({hash})
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

    const job = {
      services: {
        cowsay: {
          image: 'grycap/cowsay:latest',
          entrypoint: ['/usr/games/cowsay', 'hello messaging meeting'],
        }
      }
    }
    await buyersClient.offer(offer, job)
    // new promise wait for 10 seconds
    await new Promise(resolve => setTimeout(resolve, 45000));
  })


})
