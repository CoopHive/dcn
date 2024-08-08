pragma solidity 0.8.26;

import "hardhat/console.sol";

import { IEAS, Attestation } from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import { SchemaResolver } from "@ethereum-attestation-service/eas-contracts/contracts/resolver/SchemaResolver.sol";
import { ISchemaResolver } from "@ethereum-attestation-service/eas-contracts/contracts/resolver/ISchemaResolver.sol";
import { UserCollateral } from "./ITCR.sol";

import { IERC20  } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20  } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TrustedValidatorResolver is SchemaResolver {
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


