// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

library SharedTypes {
    enum BidStatus {
        Nonexistent,
        Validating,
        Open,
        HasAsk,
        Closed,
        Canceled
    }
    enum AskStatus {
        Nonexistent,
        Validating,
        Accepted,
        Rejected
    }
    struct Claim {
        IClaim claimContract;
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

abstract contract IClaim {
    uint claimCount;
    mapping(uint => bytes32) public claims;
    mapping(uint => address) public creator;

    function _makeClaim(bytes32 claimHash) internal returns (uint id) {
        id = ++claimCount;
        claims[id] = claimHash;
        creator[id] = msg.sender;
    }
}

abstract contract IValidator {
    function startValidate(SharedTypes.Claim memory claim) public virtual; // should be protected, e.g. onlyDeal
    function validate(
        SharedTypes.Claim memory claim,
        bool result
    ) public virtual; // should be protected, e.g. onlyOracle
}
