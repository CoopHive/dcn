import type { BuyData } from "coophive-sdk";
import type { SignedOffchainAttestation } from "@ethereum-attestation-service/eas-sdk";

interface Offer {
  _tag: "offer";
  buyData: BuyData;
}

interface Cancel {
  _tag: "cancel";
  error?: string;
}

interface Attest {
  _tag: "attest";
  offchainAttestation?: SignedOffchainAttestation
}

export type BuyerAttest = Attest & { offer: Omit<Offer, "_tag"> };
type SellerAttest = Attest & { result: string };

export type BuyerMessage = { offerId: string; responseTopic?: string } & (
  | Offer
  | Cancel
  | BuyerAttest
);

export type SellerMessage = { 
  offerId: string;

} & (
  | Offer
  | Cancel
  | SellerAttest
);
