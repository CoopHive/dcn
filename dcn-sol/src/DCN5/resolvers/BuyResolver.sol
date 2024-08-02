
// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

//import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
//import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "forge-std/console.sol";

import { SchemaResolver } from "@ethereum-attestation-service/eas-contracts/resolver/SchemaResolver.sol";

import { IEAS, Attestation } from "@ethereum-attestation-service/eas-contracts/IEAS.sol";

/// @title CollateralResolver
/// @notice Basic ethereum collateral resolver
contract CollateralResolver is SchemaResolver {

    constructor(IEAS eas) SchemaResolver(eas) {
     // _targetValue = 100 wei;

    }

    function isPayable() public pure override returns (bool) {
        return true;
    }

    function onAttest(Attestation calldata attestation, uint256 value) internal  override returns (bool) {
      (
        uint8 action,
        uint256 collateral,
        uint256 paymentAmount,
        
      ) = abi.decode(
        attestation.data,
        (uint8, uint256, uint256, address));

        // Creating Statement
        if (action == 0 ) {
          // call Ivalidator(buyerAddress)
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
            uint256 counterPaymentAmount,
          ) = abi.decode(
            counterPartyAttestation.data,
            (uint8, uint256, uint256, address)
          );
          payable(counterPartyAttestation.recipient).transfer(
            counterPaymentAmount
          );
          return true;
        }
        // redistributing collateral
        if (action == 2) {
          Attestation memory supplierAttestation = _eas.getAttestation(
            attestation.refUID
          );
          (
            , 
            uint256 supplierCollateral,
            ,
            address validatorSupplier
          ) = abi.decode(
            supplierAttestation.data,
            (uint8, uint256, uint256, address)
          );
          Attestation memory demanderAttestation = _eas.getAttestation(
            supplierAttestation.refUID
          );
          (
            ,
            uint256 demanderCollateral,
            ,
            address validatorDemander
          ) = abi.decode(
            demanderAttestation.data,
            (uint8, uint256, uint256, address)
          );
          if (attestation.attester == validatorDemander &&
            attestation.attester == validatorSupplier)  {
            payable(demanderAttestation.recipient).transfer(
              demanderCollateral
            );
            payable(supplierAttestation.recipient).transfer(
              supplierCollateral
            );
          } else {
            revert("Validator not authorized to distribute collateral back");
          }
          
          return true;
        }
    }

    function onRevoke(Attestation calldata /*attestation*/, uint256 /*value*/) internal pure override returns (bool) {
    }

}
