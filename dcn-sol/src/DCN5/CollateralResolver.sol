
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
    //uint256 private immutable _targetValue;
    //error InvalidAllowance();

    constructor(IEAS eas) SchemaResolver(eas) {
     // _targetValue = 100 wei;
    }

    function isPayable() public pure override returns (bool) {
        return true;
    }

    function onAttest(Attestation calldata attestation, uint256 value) internal  override returns (bool) {
      console.log("here 2");
      (
        uint8 action,
        uint256 collateral,
        uint256 paymentAmount
      ) = abi.decode(
        attestation.data,
        (uint8, uint256, uint256));

        // Creating Statement
        if (action == 0 ) {
          return (collateral + paymentAmount == value);
        }
        // matching a statement
        if (action == 1) {
          Attestation memory counterPartyAttestation = _eas.getAttestation(
            attestation.refUID
          );
          (
            , 
            uint256 collateral,
            uint256 counterPaymentAmount  
          ) = abi.decode(
            counterPartyAttestation.data,
            (uint8, uint256, uint256)
          );
          payable(counterPartyAttestation.recipient).transfer(
            counterPaymentAmount
          );
          return true;
        }

        if (action == 2) {
          console.log("Matching statement");
          console.logBytes32(attestation.refUID);
          Attestation memory supplierAttestation = _eas.getAttestation(
            attestation.refUID
          );
          (
            , 
            uint256 supplierCollateral,
          ) = abi.decode(
            supplierAttestation.data,
            (uint8, uint256, uint256)
          );
          payable(supplierAttestation.recipient).transfer(
            supplierCollateral
          );
          Attestation memory demanderAttestation = _eas.getAttestation(
            supplierAttestation.refUID
          );
          (
            ,
            uint256 demanderCollateral,
          ) = abi.decode(
            demanderAttestation.data,
            (uint8, uint256, uint256)
          );
          payable(demanderAttestation.recipient).transfer(
            demanderCollateral
          );
          return true;
        }
    }

    function onRevoke(Attestation calldata /*attestation*/, uint256 /*value*/) internal pure override returns (bool) {
    }

}
