// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./Interfaces.sol";

contract DCNBidClaim is IClaim {
    function getData(uint claim) public override returns (bytes memory) {
        return abi.encodePacked(claim);
    }

    function getProof(uint claim) public override returns (bytes memory) {
        return abi.encodePacked(claim);
    }
}

contract DCNAskClaim is IClaim {
    function getData(uint claim) public override returns (bytes memory) {
        return abi.encodePacked(claim);
    }

    function getProof(uint claim) public override returns (bytes memory) {
        return abi.encodePacked(claim);
    }
}

contract DCNBidValidator is IValidator {
    function startValidate(SharedTypes.Claim memory claim) public override {
        // do nothing
    }

    function validate(uint id, bool result) public override {
        // do nothing
    }
}

contract DCNAskValidator is IValidator {
    function startValidate(SharedTypes.Claim memory claim) public override {
        // do nothing
    }

    function validate(uint id, bool result) public override {
        // do nothing
    }
}

contract DCNDeal is Deal {
    constructor()
        Deal(
            CDNBidValidator(address(new DCNBidValidator())),
            CDNAskValidator(address(new DCNAskValidator()))
        )
    {}
}
