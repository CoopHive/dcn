
import type { BuyerMessage, SellerMessage } from './message-schema.ts';
import { producer, consumer } from './kafka-config.ts';
import EAS from './artifacts/EAS.json'
import SchemaRegistry from './artifacts/SchemaRegistry.json'
import { 
  //createBuyAttestation,
  //createSellAttestation,
  //createValidationAttestation,
  //buySchema,
  //sellSchema,
  //validationSchema,
  signOffchainBuyMessage,
  //verifyOffchainBuyMessage,
  //attestBuyMessage
} from "coophive-sdk"
import { createWalletClient } from 'viem'
export const makeOffer = async (offer: BuyerMessage): Promise<void> => {
  await producer.connect();

  await producer.send({
    topic: 'buyer-offers',
    messages: [{ value: JSON.stringify(offer) }],
  });
  console.log('Offer sent:', offer);

  if (offer.responseTopic) {
    await consumer.connect();
    await consumer.subscribe({ topic: offer.responseTopic, fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) {
          console.error('Received message with null value');
          return;
        }

        const response: SellerMessage = JSON.parse(message.value.toString());
        console.log('Received seller response:', response);

        if (response._tag === 'attest' && 'result' in response) {
          await consumer.disconnect();
          await producer.disconnect();
          console.log('Deal finalized. Disconnected from Kafka.');
        }
      },
    });
  }
};

const runBuyerClient = async () => {
  // create off chain EAS
  
  const buyer = createWalletClient({})
  
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


  /*
  const initialOffer: BuyerMessage = {
    offerId: '123',
    provider: '0xabc123',
    query: 'QueryData',
    price: ['0xSomeAddress', 100],
    _tag: 'offer',
    responseTopic: 'seller-responses',
  };
 */

  await makeOffer(offchainAttestation);
};

runBuyerClient().catch(console.error);


