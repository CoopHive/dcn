// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

library SharedTypes {
    enum BidStatus {
        Nonexistent,
        Validating,
        Open,
        HasAsk,
        Closed
    }
    enum AskStatus {
        Nonexistent,
        Validating,
        Accepted,
        Rejected
    }
    struct Claim {
        address claimContract;
        uint claimId;
    }
    struct BidData {
        Claim claim;
        address creator;
        BidStatus status;
    }
    struct AskData {
        Claim claim;
        address creator;
        uint bidId;
        AskStatus status;
    }
}
