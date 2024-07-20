interface MessageRequestCredits {
  type: "request-credits";
  dealId: string;
  publicKey: string;
  amount: number;
}

interface MessageOkRequest {
  type: "ok-request";
  dealId: string;
  publicKey: string;
  amount: number;
}

interface MessageOnChainBidSubmitted {
  type: "bid-submitted";
  dealId: string;
  publicKey: string;
  dealContract: string;
  bidId: number;
}

interface MessageOnChainAskSubmitted {
  type: "ask-submitted";
  dealId: string;
  publicKey: string;
  dealContract: string;
  askId: number;
}
