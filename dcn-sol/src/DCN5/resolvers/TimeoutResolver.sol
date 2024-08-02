pragma solidity 0.8.26;

import "forge-std/console.sol";

import { SchemaResolver } from "@ethereum-attestation-service/eas-contracts/resolver/SchemaResolver.sol";

import { IEAS, Attestation } from "@ethereum-attestation-service/eas-contracts/IEAS.sol";

contract TimeoutResolver is SchemaResolver {

  function isPayable() public pure override returns (bool) {
    return true;
  }

  constructor(IEAS eas) SchemaResolver(eas) {
  }

  function onTimeout(Attestation calldata attestation) internal  override returns (bool) {
    return true;
  }

  function onAttest(Attestation calldata attestation, uint256 value) internal  override returns (bool) {
    return true;
  }

  function onRevoke(Attestation calldata /*attestation*/, uint256 /*value*/) internal pure override returns (bool) {
  }
}
