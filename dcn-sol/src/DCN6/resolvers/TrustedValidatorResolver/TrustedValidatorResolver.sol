pragma solidity 0.8.26;

import "forge-std/console.sol";

import { IEAS, Attestation } from "@ethereum-attestation-service/eas-contracts/IEAS.sol";
import { SchemaResolver } from "@ethereum-attestation-service/eas-contracts/resolver/SchemaResolver.sol";
import { UserCollateral } from "./ITCR.sol";

contract TrustedValidatorResolver is SchemaResolver {
  address validator; 
  address buyCollateralResolver;
  address sellCollateralResolver;
  mapping (address => UserCollateral) public userCollateral;

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
  ) internal pure override returns (bool) {

  }


  function addCollateral(
    address user,
    uint256 collateral
  ) public payable onlyResolvers {
    userCollateral[user].lockedCollateral += collateral;
  }
}


