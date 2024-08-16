interface Offer {
  _tag: "offer";
  provider: `0x${string}`;
  query: string;
  price: [string, number];
}

interface Cancel {
  _tag: "cancel";
  error?: string;
}

interface Attest {
  _tag: "attest";
  attestation: string;
}

type BuyerAttest = Attest & { offer: Omit<Offer, "_tag"> };
type SellerAttest = Attest & { result: string };

export type BuyerMessage = { offerId: string; responseTopic?: string } & (
  | Offer
  | Cancel
  | BuyerAttest
);

export type SellerMessage = { offerId: string } & (
  | Offer
  | Cancel
  | SellerAttest
);
