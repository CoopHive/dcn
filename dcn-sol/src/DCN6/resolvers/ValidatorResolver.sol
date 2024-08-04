pragma solidity 0.8.26;

import "forge-std/console.sol";

import { IEAS, Attestation } from "@ethereum-attestation-service/eas-contracts/IEAS.sol";
import { SchemaResolver } from "@ethereum-attestation-service/eas-contracts/resolver/SchemaResolver.sol";


contract ValidatorResolver is SchemaResolver {
  constructor (IEAS eas) SchemaResolver(eas) {}

  function isPayable() public pure override returns (bool) {
    return true;
  }

  function onAttest(
    Attestation calldata attestation,
    uint256 value
  ) internal override returns (bool) {
    (
      bool isApproved
    ) = abi.decode(
      attestation.data,
      (bool)
    );

    Attestation memory sellerAttestation = _eas.getAttestation(
      attestation.refUID
    );
    (
      uint256 collateral,
    ) = abi.decode(
      sellerAttestation.data,
      (uint256, address)
    );
    Attestation memory buyerAttestation = _eas.getAttestation(
      sellerAttestation.refUID
    );

    (
      uint256 amount,
      ,
      ,
    ) = abi.decode(
      buyerAttestation.data,
      (uint256, uint256, address, uint256)
    );

    if (isApproved) {
      payable(sellerAttestation.recipient).transfer(amount + collateral);      
    } else {
      payable(buyerAttestation.recipient).transfer(amount + collateral);
  }
    return true;
  }

  function onRevoke(
    Attestation calldata attestation,
    uint256 value
  ) internal pure override returns (bool) {}
}


