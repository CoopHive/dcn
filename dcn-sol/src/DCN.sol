// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./Interfaces.sol";
import "./Deal.sol";

contract DCNBidClaim is IClaim {}

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
