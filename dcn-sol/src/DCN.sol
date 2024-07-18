// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./Interfaces.sol";
import "./Deal.sol";

contract DCNBidClaim is IClaim {
    // TODO modify collateral to EIP-6909 rather than ETH

    Deal deal;

    struct BidClaimData {
        uint collateralAvailable;
        uint demandedCredits;
    }

    mapping(uint => BidClaimData) public bidClaims;

    constructor(address deal_) {
        // deal is contract-level rather than function-level because it has to be trusted;
        // but a claim could be intended for multiple deals
        deal = Deal(deal_);
    }

    function makeClaim(uint credits) public payable returns (uint id) {
        id = _makeClaim(keccak256(abi.encodePacked(deal, credits)));
        bidClaims[id] = BidClaimData(msg.value, credits);
    }

    function reclaimCollateral(uint bidId) public {
        (
            SharedTypes.Claim memory claim,
            address bidCreator,
            SharedTypes.BidStatus status
        ) = deal.bids(bidId);
        require(claim.claimContract == this, "Claim contract mismatch");
        require(
            bidCreator == msg.sender,
            "Only the bidder can call this function"
        );
        require(status == SharedTypes.BidStatus.Open, "Bid is not open");

        payable(bidCreator).transfer(
            bidClaims[claim.claimId].collateralAvailable
        );
        bidClaims[claim.claimId].collateralAvailable = 0;
    }

    function collectCollateral(uint askId) public {
        (
            SharedTypes.Claim memory askClaim,
            address askCreator,
            uint bidId,
            SharedTypes.AskStatus status
        ) = deal.asks(askId);
        (SharedTypes.Claim memory bidClaim, , ) = deal.bids(bidId);

        require(askClaim.claimContract == this, "Claim contract mismatch");
        require(
            askCreator == msg.sender,
            "Only the ask creator can call this function"
        );
        require(
            status == SharedTypes.AskStatus.Accepted,
            "Ask is not accepted"
        );

        payable(askCreator).transfer(
            bidClaims[bidClaim.claimId].collateralAvailable
        );
    }
}

contract DCNAskClaim is IClaim {
    Deal public deal;

    function makeClaim(bytes32 dealData) public returns (uint id) {
        id = _makeClaim(dealData);
    }
}

contract DCNBidValidator is IValidator {
    Deal public deal;
    address seller;
    uint unitPrice;

    modifier onlyDeal() {
        require(
            msg.sender == address(deal),
            "Only the deal can call this function"
        );
        _;
    }

    modifier onlySeller() {
        require(msg.sender == seller, "Only the seller can call this function");
        _;
    }

    function setUnitPrice(uint price) public onlySeller {
        unitPrice = price;
    }

    function startValidate(
        SharedTypes.Claim memory claim
    ) public override onlyDeal {
        DCNBidClaim bid = DCNBidClaim(address(claim.claimContract));
        (uint collateralAvailable, uint demandedCredits) = bid.bidClaims(
            claim.claimId
        );
        collateralAvailable >= unitPrice * demandedCredits
            ? deal.finalize(claim.claimId, true)
            : deal.finalize(claim.claimId, false);
    }

    function validate(
        SharedTypes.Claim memory claim,
        bool result
    ) public override {
        // do nothing since validation is immediate
    }
}

contract DCNAskValidator is IValidator {
    Deal public deal;
    modifier onlyDeal() {
        require(
            msg.sender == address(deal),
            "Only the deal can call this function"
        );
        _;
    }

    function startValidate(
        SharedTypes.Claim memory claim
    ) public override onlyDeal {
        // "we are on the path to decentralization"
        deal.finalize(claim.claimId, true);
    }

    function validate(
        SharedTypes.Claim memory claim,
        bool result
    ) public override {
        // do nothing since validation is immediate
    }
}

contract DCNDeal is Deal {
    constructor()
        Deal(address(new DCNBidValidator()), address(new DCNAskValidator()))
    {}
}
