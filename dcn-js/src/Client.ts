import "dotenv/config";

import type { Producer, Consumer } from 'kafkajs';

import type { PublicClient, WalletClient } from 'viem'
import { createWalletClient, createPublicClient, webSocket } from 'viem'
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

import EAS from './artifacts/EAS.json'
import SchemaRegistry from './artifacts/SchemaRegistry.json'

import type { BuyStruct, BuyParams } from 'coophive-sdk'

export class BuyerClient {
  publicClient: PublicClient;
  walletClient: WalletClient;
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
 
    this.producer = producer;
    this.producer.connect();

    this.consumer = consumer;
  }

  async makeOffer(offer: BuyParams): Promise<void> {
    const 
    await makeOffer(offer);
  }
}
