pragma solidity 0.8.26;

import "hardhat/console.sol";

import { IEAS, Attestation } from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import { SchemaResolver } from "@ethereum-attestation-service/eas-contracts/contracts/resolver/SchemaResolver.sol";
import { ISchemaResolver } from "@ethereum-attestation-service/eas-contracts/contracts/resolver/ISchemaResolver.sol";
import { UserCollateral } from "./ITCR.sol";

import { IERC20  } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20  } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TrustedValidatorResolver is SchemaResolver {
  using SafeERC20 for IERC20;
  error InvalidAllowance();

  address validator; 
  address buyCollateralResolver;
  address sellCollateralResolver;

  // user => erc20 address => collateral struct
  mapping (address => mapping (address => UserCollateral)) public userCollateral;

  constructor (
    IEAS eas,
    address _validator
  ) SchemaResolver(eas) {
    validator = _validator;
  }

  modifier onlyResolvers() {
    require(msg.sender == buyCollateralResolver || msg.sender == sellCollateralResolver, "Only resolvers");
    _;
  }

  modifier onlyValidator() {
    require(msg.sender == validator, "Only validator");
    _;
  }

  function setBuyCollateralResolver(
    address _buyCollateralResolver
  ) public onlyValidator {
    buyCollateralResolver = _buyCollateralResolver; 
  }

  function setSellCollateralResolver(
    address _sellCollateralResolver 
  ) public onlyValidator {
    sellCollateralResolver = _sellCollateralResolver;
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
      uint256 collateral
    ) = abi.decode(
      sellerAttestation.data,
      (uint256)
    );
    Attestation memory buyerAttestation = _eas.getAttestation(
      sellerAttestation.refUID
    );

    ( /*address supplier*/,
      uint256 jobCost,
      address paymentToken,
      /*uint256 creditsRequested*/,
      /*uint256 collateralRequested*/,
      /*uint256 offerDeadline*/,
      /*uint256 jobDeadline*/,
      uint256 arbitrationDeadline
    ) = abi.decode(
    buyerAttestation.data,
    (address, uint256, address, uint256, uint256, uint256, uint256, uint256)
    );

    if (isApproved) {
      // Reward and Collateral Refund
      IERC20(paymentToken).transfer(
        sellerAttestation.recipient,
        jobCost + collateral
      );
    } else {
      // Refund and get collateral
      IERC20(paymentToken).transfer(
        buyerAttestation.recipient,
        jobCost + collateral
      );
    }

    return true;
  }

  function onRevoke(
    Attestation calldata attestation,
    uint256 value
  ) internal pure override returns (bool) {

  }


  function addCollateral(
    address user,
    address paymentToken,
    uint256 collateral
  ) public payable onlyResolvers {

    userCollateral[user][paymentToken].lockedCollateral += collateral;
  }
}


