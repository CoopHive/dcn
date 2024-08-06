pragma solidity 0.8.26;

import { ISchemaResolver } from "@ethereum-attestation-service/eas-contracts/resolver/ISchemaResolver.sol";

struct UserCollateral {
  uint256 lockedCollateral;
  uint256 freeCollateral;
}

interface ITCR is ISchemaResolver {
  function setBuyCollateralResolver(
   address _buyCollateralResolver 
  ) external;

  function setSellCollateralResolver(
   address _sellCollateralResolver 
  ) external;

  function addCollateral(
    address _validator,
    uint256 _collateral
  ) external payable;

  function userCollateral(
    address user
  ) external returns (UserCollateral memory);
}
