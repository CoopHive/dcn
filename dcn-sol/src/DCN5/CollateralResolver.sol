
// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

//import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
//import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "forge-std/console.sol";

import { SchemaResolver } from "@ethereum-attestation-service/eas-contracts/resolver/SchemaResolver.sol";

import { IEAS, Attestation } from "@ethereum-attestation-service/eas-contracts/IEAS.sol";

/// @title TokenResolver
/// @notice A sample schema resolver that checks whether a specific amount of tokens was approved to be included in an attestation.
contract CollateralResolver is SchemaResolver {
    uint256 private immutable _targetValue;
    //error InvalidAllowance();

    constructor(IEAS eas) SchemaResolver(eas) {
      _targetValue = 100 wei;
    }

    function isPayable() public pure override returns (bool) {
        return true;
    }

    function onAttest(Attestation calldata attestation, uint256 value) internal view override returns (bool) {
      console.log(value);
      //return true;
      return value == _targetValue;
    }

    function onRevoke(Attestation calldata /*attestation*/, uint256 /*value*/) internal pure override returns (bool) {
    }
}
