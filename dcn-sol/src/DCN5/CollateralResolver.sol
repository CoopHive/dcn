
// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

//import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
//import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { SchemaResolver } from "@ethereum-attestation-service/eas-contracts/resolver/SchemaResolver.sol";

import { IEAS, Attestation } from "@ethereum-attestation-service/eas-contracts/IEAS.sol";

/// @title TokenResolver
/// @notice A sample schema resolver that checks whether a specific amount of tokens was approved to be included in an attestation.
contract TokenResolver is SchemaResolver {
    //using SafeERC20 for IERC20;

    error InvalidAllowance();

    constructor(IEAS eas) SchemaResolver(eas) {
    }

    function onAttest(Attestation calldata attestation, uint256 /*value*/) internal view override returns (bool) {
    }

    function onRevoke(Attestation calldata /*attestation*/, uint256 /*value*/) internal pure override returns (bool) {
    }
}
