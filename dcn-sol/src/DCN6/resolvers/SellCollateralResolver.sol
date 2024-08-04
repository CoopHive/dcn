pragma solidity 0.8.26;

import "forge-std/console.sol";

import { IEAS, Attestation } from "@ethereum-attestation-service/eas-contracts/IEAS.sol";
import { SchemaResolver } from "@ethereum-attestation-service/eas-contracts/resolver/SchemaResolver.sol";
import { ISchemaResolver } from "@ethereum-attestation-service/eas-contracts/resolver/ISchemaResolver.sol";

contract SellCollateralResolver is SchemaResolver {
  ISchemaResolver public validatorResolver;

  constructor (IEAS eas, address _validatorResolver) SchemaResolver(eas) {
    validatorResolver = ISchemaResolver(_validatorResolver);
  }

  function isPayable() public pure override returns (bool) {
    return true;
  }

  function onAttest(
    Attestation calldata attestation,
    uint256 value
  ) internal override returns (bool) {
    (
      uint256 collateral,
      address sellerValidator
    ) = abi.decode(
      attestation.data,
      (uint256, address)
    );

    Attestation memory buyerAttestation = _eas.getAttestation(
      attestation.refUID
    );

    ( uint256 amount,
      uint256 collateralRequested,
      address buyerValidator,
      uint256 deadline
    ) = abi.decode(
      buyerAttestation.data,
      (uint256, uint256, address, uint256)
    );

    require(collateral == collateralRequested, "Collateral mismatch");
    require(collateral == value, "Value mismatch");
    require(block.number < deadline, "Deadline expired");
    require(buyerValidator == sellerValidator, "same validator for now");
    payable(address(validatorResolver)).transfer(collateral);
    return true;
  }

  function onRevoke(
    Attestation calldata attestation,
    uint256 value
  ) internal pure override returns (bool) {}
}

