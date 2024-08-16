pragma solidity 0.8.26;

import { ISchemaResolver } from "@ethereum-attestation-service/eas-contracts/contracts/resolver/ISchemaResolver.sol";

struct UserCollateral {
  uint256 lockedCollateral;
  uint256 freeCollateral;
}

interface ITCR is ISchemaResolver {
  function setBuyCollateralResolver(
   address buyCollateralResolver 
  ) external;

  function setSellCollateralResolver(
   address sellCollateralResolver 
  ) external;

  function addCollateral(
    address validator,
    address collateralToken,
    uint256 collateral
  ) external payable;

  function userCollateral(
    address user,
    address paymentToken
  ) external returns (UserCollateral memory);
}
