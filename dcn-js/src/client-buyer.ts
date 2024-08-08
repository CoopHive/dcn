import type { BuyerMessage } from './message-schema';
import { producer, consumer } from './kafka-config';

// Function for the buyer to make an offer
export const makeOffer = async (offer: BuyerMessage): Promise<void> => {
  await producer.connect();
  await producer.send({
    topic: 'buyer-offers',
    messages: [{ value: JSON.stringify(offer) }],
  });
  console.log('Offer sent:', offer);
  await producer.disconnect();
};

// Consumer to listen to responses from sellers
const listenForResponses = async (responseTopic: string) => {
  await consumer.connect();
  await consumer.subscribe({ topic: responseTopic, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      if (!message.value) {
        console.error('Received message with null value');
        return;
      }

      const response: BuyerMessage = JSON.parse(message.value.toString());
      console.log('Received seller response:', response);
    },
  });
};

// Example usage: Buyer sends an offer and listens for responses
const runBuyerClient = async () => {
  const initialOffer: BuyerMessage = {
    offerId: '123',
    credits: 'abc123',
    provider: 'ProviderName',
    price: 100,
    deposit_attestation: 'some_attestation',
    responseTopic: 'seller-responses',
  };

  await makeOffer(initialOffer);
  await listenForResponses(initialOffer.responseTopic);
};

runBuyerClient().catch(console.error);
