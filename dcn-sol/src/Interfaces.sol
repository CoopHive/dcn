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

abstract contract IValidatable {
    function finalize(uint id, bool result) public virtual;
}

abstract contract IValidator {
    function startValidate(SharedTypes.Claim memory claim) public virtual;
    function validate(uint id, bool result) public virtual; // should be protected, e.g. onlyOracle
}
