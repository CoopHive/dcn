// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./Interfaces.sol";
import "./Deal.sol";

contract DCNBidClaim is IClaim {
    // TODO modify collateral to EIP-6909 rather than ETH

    struct BidData {
        address deal;
        uint collateralAvailable;
        uint demandedCredits;
    }

    mapping(uint => BidData) public bids;

    function makeBid(
        uint credits,
        address deal
    ) public payable returns (uint id) {
        id = _makeClaim(keccak256(abi.encodePacked(deal, credits)));
        bids[id] = BidData(deal, msg.value, credits);
    }

    function cancelBid(uint claimId) public {
        (
            SharedTypes.Claim memory claim,
            address bidCreator,
            SharedTypes.BidStatus status
        ) = Deal(bids[claimId].deal).bids(claimId);

        require(
            claim.claimContract == this && claim.claimId == claimId,
            "Claim contract or ID mismatch"
        );
        require(
            bidCreator == msg.sender,
            "Only the bidder can call this function"
        );
        require(status == SharedTypes.BidStatus.Open, "Bid is not open");

        payable(msg.sender).transfer(bids[claimId].collateralAvailable);
        bids[claimId].collateralAvailable = 0;
    }
}

contract DCNAskClaim is IClaim {
    Deal public deal;

    function makeAsk(bytes32 dealData) public returns (uint id) {
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
        (, uint collateralAvailable, uint demandedCredits) = bid.bids(
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
