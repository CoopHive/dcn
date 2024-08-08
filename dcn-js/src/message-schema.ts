export interface BuyerMessage {
  offerId: string;
  credits: string;
  provider: string;
  price: number;
  deposit_attestation: string;
  responseTopic: string;
}

export interface SellerMessage {
  offerId: string;
  credits: string;
  provider: string;
  price: number;
}
