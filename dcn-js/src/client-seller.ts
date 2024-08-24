import type { BuyerMessage, SellerMessage } from './message-schema.ts';
import { producer, consumer } from './kafka-config.ts';
import EAS from './artifacts/EAS.json'
import SchemaRegistry from './artifacts/SchemaRegistry.json'
import { createWalletClient, createPublicClient } from 'viem'
import { 
  //createBuyAttestation,
  //createSellAttestation,
  //createValidationAttestation,
  //buySchema,
  //sellSchema,
  //validationSchema,
  signOffchainBuyMessage,
  verifyOffchainBuyMessage,
  //attestBuyMessage
} from "coophive-sdk"
export const onOffer = async (offer: BuyerMessage): Promise<SellerMessage> => {
  console.log('Received offer for negotiation:', offer);
  const walletClient = createWalletClient({})
  const publicClient = createPublicClient({})
  const verification = await verifyOffchainBuyMessage(
    EAS.addressMainnet,
    walletClient,
    offer.address,
    offer.offchainAttestation
  )

  // ask autonomous agent to either accept offchain message
  // if accept = true, than pass mirror offchain attestation back to buyer
  // if false create a new offchain message and pass back to buyer
  //
  //
  const accepted: boolean = await judgeOffer(offer)


  if (accepted) {
    const offchainAttestation = await signOffchainBuyMessage(
      EAS.addressMainnet,
      walletClient,
      {
        schemaUID: buySchemaUID,
        demander: buyer.account.address,
        data: {
          supplier: buyer.account.address, 
          jobCost: 100n,
          paymentToken: erc20.address,
          image: 'grycap/cowsay:latest',
          prompt: 'hello coophive',
          collateralRequested: 100n,
          offerDeadline: (await publicClient.getBlockNumber()) + 1800n,
          jobDeadline: (await publicClient.getBlockNumber()) + 3600n,
          arbitrationDeadline: (await publicClient.getBlockNumber()) + 7200n
        }
      }
    )
  } else {
    const offchainAttestation = await signOffchainBuyMessage(
      easAddress,
      buyer,
      {
        schemaUID: buySchemaUID,
        demander: buyer.account.address,
        data: {
          supplier: buyer.account.address, 
          jobCost: 100n,
          paymentToken: erc20.address,
          image: 'grycap/cowsay:latest',
          prompt: 'hello coophive',
          collateralRequested: 100n,
          offerDeadline: (await publicClient.getBlockNumber()) + 1800n,
          jobDeadline: (await publicClient.getBlockNumber()) + 3600n,
          arbitrationDeadline: (await publicClient.getBlockNumber()) + 7200n
        }
      }
    )

  }


  const negotiatedOffer: SellerMessage = {
    offerId: offer.offerId,
    provider: offer.provider,
    query: offer.query,
    price: [offer.price[0], offer.price[1] + 10],
    _tag: 'offer',
  };

  console.log('Negotiated offer:', negotiatedOffer);
  return negotiatedOffer;
};

export const reply = async (response: SellerMessage): Promise<void> => {
  console.log('Replying with:', response);
  await producer.send({
    topic: 'seller-responses',
    messages: [{ value: JSON.stringify(response) }],
  });
  console.log('Reply sent:', response);
};

const listenForOffers = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'buyer-offers', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) {
        console.error('Received message with null value');
        return;
      }

      const offer: BuyerMessage = JSON.parse(message.value.toString());
      console.log('Received buyer offer:', offer);

      const negotiatedOffer = await onOffer(offer);

      await reply(negotiatedOffer);
    },
  });
};

listenForOffers().catch(console.error);
