pragma solidity 0.8.26;

import "hardhat/console.sol";
import { IEAS, Attestation } from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import { SchemaResolver } from "@ethereum-attestation-service/eas-contracts/contracts/resolver/SchemaResolver.sol";
import { ISchemaResolver } from "@ethereum-attestation-service/eas-contracts/contracts/resolver/ISchemaResolver.sol";

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
    ( address supplier,
      uint256 jobCost,
      uint256 creditsRequested,
      uint256 collateralRequested,
      address validator,
      uint256 offerDeadline,
      uint256 jobDeadline,
      uint256 arbitrationDeadline
    ) = abi.decode(
    attestation.data,
    (address, uint256, uint256, uint256, address, uint256, uint256, uint256)
    );
    //require(block.number < deadline, "Invalid deadline");
    require(jobCost == value, "Invalid amount");

    validatorResolver.addCollateral{value:msg.value}(attestation.recipient, jobCost);
    //payable(address(validatorResolver)).transfer(amount);
    console.log("Attested");
    return true;
  }

  function onRevoke(
    Attestation calldata attestation,
    uint256 value
  ) internal pure override returns (bool) {
    return true;
  }
}

