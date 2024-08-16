import type { BuyerMessage, SellerMessage } from './message-schema.ts';
import { producer, consumer } from './kafka-config.ts';

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
  const initialOffer: BuyerMessage = {
    offerId: '123',
    provider: '0xabc123',
    query: 'QueryData',
    price: ['0xSomeAddress', 100],
    _tag: 'offer',
    responseTopic: 'seller-responses',
  };

  await makeOffer(initialOffer);
};

runBuyerClient().catch(console.error);
