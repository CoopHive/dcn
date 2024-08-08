import type { BuyerMessage, SellerMessage } from './message-schema.ts';
import { producer, consumer } from './kafka-config.ts';

// Function to handle offers from buyers
export const onOffer = async (offer: BuyerMessage): Promise<SellerMessage> => {
  // Implement your negotiation logic here. Added a dummy negotiation that will increase price by 10 units.
  console.log('Received offer for negotiation:', offer);

  const negotiatedOffer: SellerMessage = {
    offerId: offer.offerId,
    credits: offer.credits,
    provider: offer.provider,
    price: offer.price + 10,
  };

  console.log('Negotiated offer:', negotiatedOffer);
  return negotiatedOffer;
};

// Function for the seller to fulfill an offer
export const fulfillOffer = async (offer: SellerMessage): Promise<void> => {
  console.log('Fulfilling offer:', offer);
  await producer.connect();
  await producer.send({
    topic: 'seller-responses',
    messages: [{ value: JSON.stringify(offer) }],
  });
  console.log('Fulfilled offer sent:', offer);
  await producer.disconnect();
};

// Consumer to listen to buyer offers
const listenForOffers = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'buyer-offers', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      if (!message.value) {
        console.error('Received message with null value');
        return;
      }

      const offer: BuyerMessage = JSON.parse(message.value.toString());
      console.log('Received buyer offer:', offer);

      // Handle negotiation
      const negotiatedOffer = await onOffer(offer);

      // Fulfill the offer
      await fulfillOffer(negotiatedOffer);
    },
  });
};

listenForOffers().catch(console.error);
