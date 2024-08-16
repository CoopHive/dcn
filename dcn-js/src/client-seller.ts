import type { BuyerMessage, SellerMessage } from './message-schema.ts';
import { producer, consumer } from './kafka-config.ts';

export const onOffer = async (offer: BuyerMessage): Promise<SellerMessage> => {
  console.log('Received offer for negotiation:', offer);

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
