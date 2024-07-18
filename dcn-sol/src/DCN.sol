// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./Interfaces.sol";
import "./Deal.sol";

contract DCNBidClaim is IClaim {
    // TODO modify collateral to EIP-6909 rather than ETH
    mapping(uint => uint) public collateralAvailable;

    mapping(uint => uint) public bidToClaim;
    Deal public deal;

    function claimCollateral(uint askId) public {
        (, address creator, uint bidId, SharedTypes.AskStatus status) = deal
            .asks(askId);
        require(creator == msg.sender, "Not ask creator");
        require(status == SharedTypes.AskStatus.Accepted, "Ask not accepted");

        uint claimId = bidToClaim[bidId];
        require(collateralAvailable[claimId] > 0, "No collateral to claim");
        payable(msg.sender).transfer(collateralAvailable[claimId]);
        collateralAvailable[claimId] = 0;
    }

    function makeBid(bytes32 dealData) public payable returns (uint id) {
        id = _makeClaim(dealData);
        collateralAvailable[id] = msg.value;
        uint dealId = deal.makeBid(SharedTypes.Claim(this, id));
        bidToClaim[dealId] = id;
    }

    function cancelBid(uint bidId) public {
        (, address creator, SharedTypes.BidStatus status) = deal.bids(bidId);
        require(creator == msg.sender, "Not bid creator");
        require(status == SharedTypes.BidStatus.Open, "Bid is not open");

        uint claimId = bidToClaim[bidId];
        payable(msg.sender).transfer(collateralAvailable[claimId]);
        collateralAvailable[claimId] = 0;
        deal.cancelBid(bidId);
    }
}

contract DCNAskClaim is IClaim {}

contract DCNBidValidator is IValidator {
    function startValidate(SharedTypes.Claim memory claim) public override {
        // do nothing
    }

    function validate(
        SharedTypes.Claim memory claim,
        bool result
    ) public override {
        // do nothing
    }
}

contract DCNAskValidator is IValidator {
    function startValidate(SharedTypes.Claim memory claim) public override {
        // do nothing
    }

    function validate(
        SharedTypes.Claim memory claim,
        bool result
    ) public override {
        // do nothing
    }
}

contract DCNDeal is Deal {
    constructor()
        Deal(address(new DCNBidValidator()), address(new DCNAskValidator()))
    {}
}
