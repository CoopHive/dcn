pragma solidity 0.8.26;

import "hardhat/console.sol";

import { IERC20  } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20  } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { IEAS, Attestation } from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import { SchemaResolver } from "@ethereum-attestation-service/eas-contracts/contracts/resolver/SchemaResolver.sol";
import { ISchemaResolver } from "@ethereum-attestation-service/eas-contracts/contracts/resolver/ISchemaResolver.sol";

import { ITCR } from './TrustedValidatorResolver/ITCR.sol';

contract SellCollateralResolver is SchemaResolver {
  using SafeERC20 for IERC20;
  error InvalidAllowance();
  
  ITCR public validatorResolver;

  constructor (IEAS eas, address _validatorResolver) SchemaResolver(eas) {
    validatorResolver = ITCR(_validatorResolver);
  }

  function onAttest(
    Attestation calldata attestation,
    uint256 /*value*/
  ) internal override returns (bool) {
    console.log('hi');
    (
      uint256 collateral
    ) = abi.decode(
      attestation.data,
      (uint256)
    );
    console.log('decoded');

    Attestation memory buyerAttestation = _eas.getAttestation(
      attestation.refUID
    );
    console.log('buyUID');


    ( address supplier,
      /*uint256 jobCost*/,
      address paymentToken,
      /*uint256 creditsRequested*/,
      uint256 collateralRequested,
      uint256 offerDeadline,
      uint256 jobDeadline,
      uint256 arbitrationDeadline
    ) = abi.decode(
    buyerAttestation.data,
    (address, uint256, address, uint256, uint256, uint256, uint256, uint256)
    );
    console.log('buyAttestation decoded');
    require(collateral == collateralRequested, "Collateral mismatch");

    require(block.number < offerDeadline, "Offer Deadline expired");
    require(offerDeadline < jobDeadline, "Job must finish after offer");
    require(jobDeadline < arbitrationDeadline, "Arbitration must finish after job");

    IERC20(paymentToken).transferFrom(attestation.recipient, address(validatorResolver), collateral);
    validatorResolver.addCollateral(attestation.recipient, paymentToken, collateral);
    
    return true;
  }

  function onRevoke(
    Attestation calldata attestation,
    uint256 value
  ) internal pure override returns (bool) {}
}

