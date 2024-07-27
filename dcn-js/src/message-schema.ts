interface MessageRequestCredits {
  _tag: "request-credits";
  dealId: string;
  publicKey: string;
  amount: number;
}

interface MessageOkRequest {
  _tag: "ok-request";
  dealId: string;
  publicKey: string;
  amount: number;
}

interface MessageOnChainBidSubmitted {
  _tag: "bid-submitted";
  dealId: string;
  publicKey: string;
  dealContract: string;
  bidId: number;
}

interface MessageOnChainAskSubmitted {
  _tag: "ask-submitted";
  dealId: string;
  publicKey: string;
  dealContract: string;
  askId: number;
}
