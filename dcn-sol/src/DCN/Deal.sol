// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./Interfaces.sol";
import "forge-std/console.sol";
contract Deal is IValidatable {
    IValidator public bidValidator;
    IValidator public askValidator;

    event BidCreated(uint id, SharedTypes.Claim claim);
    event AskCreated(uint id, SharedTypes.Claim claim, uint bidId);
    event BidCanceled(uint id);
    event BidFinalized(uint id, bool result);
    event AskFinalized(uint id, bool result);

    uint public claimCount;
    mapping(uint => bool) public claimIsBid;

    mapping(uint => SharedTypes.BidData) public bids;
    mapping(uint => SharedTypes.AskData) public asks;

    modifier onlyBidder(uint bidId) {
        require(
            bids[bidId].creator == msg.sender,
            "Only the bidder can call this function"
        );
        _;
    }
    modifier onlyValidator(uint id) {
      console.log("claimIsBid:");
      console.log(claimIsBid[id]);
      console.log("message.sender", msg.sender);
      console.log("address(bidValidator)", address(bidValidator));
      console.log("address(askValidator)", address(askValidator));
        require(
            (claimIsBid[id] && msg.sender == address(bidValidator)) ||
            (/* !claimIsBid[id] &&  */ msg.sender == address(askValidator)),
            "Only the validator can call this function"
        );
        _;
    }

    constructor(address bidValidator_, address askValidator_) {
        bidValidator = IValidator(bidValidator_);
        askValidator = IValidator(askValidator_);
    }

    function makeBid(SharedTypes.Claim memory claim) public returns (uint id) {
        require(
            IClaim(claim.claimContract).creator(claim.claimId) == msg.sender,
            "Only the claim creator can call this function"
        );
        id = ++claimCount;
        claimIsBid[id] = true;
        bids[id] = SharedTypes.BidData(
            claim,
            msg.sender,
            SharedTypes.BidStatus.Validating
        );
        bidValidator.startValidate(claim);
        emit BidCreated(id, claim);
    }

    function makeAsk(
        uint bidId,
        SharedTypes.Claim memory claim
    ) public returns (uint id) {
        require(
            IClaim(claim.claimContract).creator(claim.claimId) == msg.sender,
            "Only the claim creator can call this function"
        );
        require(
            bids[bidId].status == SharedTypes.BidStatus.Open,
            "Bid is not open"
        );

        id = ++claimCount;
        claimIsBid[id] = false;
        //should this be claimIsBid[claim.claimId] = false ?
        console.log('claim.claimContract', address(claim.claimContract));

        asks[id] = SharedTypes.AskData(
            claim,
            msg.sender,
            bidId,
            SharedTypes.AskStatus.Validating
        );
        askValidator.startValidate(claim);
        emit AskCreated(id, claim, bidId);
    }

    function cancelBid(uint id) public onlyBidder(id) {
        require(
            bids[id].status == SharedTypes.BidStatus.Open,
            "Bid is not open"
        );
        bids[id].status = SharedTypes.BidStatus.Canceled;
        emit BidCanceled(id);
    }

    function finalize(uint id, bool result) public override onlyValidator(id) {
        if (claimIsBid[id]) {
            bids[id].status = (result &&
                bids[id].status == SharedTypes.BidStatus.Validating)
                ? SharedTypes.BidStatus.Open
                : SharedTypes.BidStatus.Canceled;
            emit BidFinalized(id, result);
        } else {
            asks[id].status = (result &&
                asks[id].status == SharedTypes.AskStatus.Validating &&
                bids[asks[id].bidId].status == SharedTypes.BidStatus.Open)
                ? SharedTypes.AskStatus.Accepted
                : SharedTypes.AskStatus.Rejected;
            emit AskFinalized(id, result);
        }
    }
}
