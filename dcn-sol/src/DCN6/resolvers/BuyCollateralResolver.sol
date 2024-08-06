pragma solidity 0.8.26;

import "forge-std/console.sol";

import { IEAS, Attestation } from "@ethereum-attestation-service/eas-contracts/IEAS.sol";
import { SchemaResolver } from "@ethereum-attestation-service/eas-contracts/resolver/SchemaResolver.sol";
import { ISchemaResolver } from "@ethereum-attestation-service/eas-contracts/resolver/ISchemaResolver.sol";

import { ITCR } from './TrustedValidatorResolver/ITCR.sol';
contract BuyCollateralResolver is SchemaResolver {
  ITCR public validatorResolver;

  constructor (IEAS eas, address _validatorResolver) SchemaResolver(eas) {
    validatorResolver = ITCR(_validatorResolver);
  }

  function isPayable() public pure override returns (bool) {
    return true;
  }

  function onAttest(
    Attestation calldata attestation,
    uint256 value
  ) internal override returns (bool) {
    (
      uint256 amount,
      uint256 collateralRequested,
      address validator,
      uint256 deadline
    ) = abi.decode(
    attestation.data,
    (uint256, uint256, address, uint256)
    );
    require(block.number < deadline, "Invalid deadline");
    require(amount == value, "Invalid amount");

    validatorResolver.addCollateral{value:msg.value}(attestation.recipient, amount);
    //payable(address(validatorResolver)).transfer(amount);
    return true;
  }

  function onRevoke(
    Attestation calldata attestation,
    uint256 value
  ) internal pure override returns (bool) {}
}

