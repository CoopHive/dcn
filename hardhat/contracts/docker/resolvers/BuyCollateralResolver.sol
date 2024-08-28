pragma solidity 0.8.26;

import "hardhat/console.sol";

import { IERC20  } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20  } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { IEAS, Attestation } from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import { SchemaResolver } from "@ethereum-attestation-service/eas-contracts/contracts/resolver/SchemaResolver.sol";
import { ISchemaResolver } from "@ethereum-attestation-service/eas-contracts/contracts/resolver/ISchemaResolver.sol";

import { ITCR } from './TrustedValidatorResolver/ITCR.sol';


contract BuyCollateralResolver is SchemaResolver {
  using SafeERC20 for IERC20;
  error InvalidAllowance();

  ITCR public validatorResolver;

  constructor (IEAS eas, address _validatorResolver) SchemaResolver(eas) {
    validatorResolver = ITCR(_validatorResolver);
  }
  /*
  function isPayable() public pure override returns (bool) {
    return true;
  }
 */

  function onAttest(
    Attestation calldata attestation,
    uint256 /*value*/
  ) internal override returns (bool) {
    console.logBytes32(attestation.uid);
    ( address supplier,
      uint256 jobCost,
      address paymentToken,
      string memory image,
      string memory prompt,
      uint256 collateralRequested,
      uint256 offerDeadline,
      uint256 jobDeadline,
      uint256 arbitrationDeadline
    ) = abi.decode(
    attestation.data,
    (address, uint256, address, string, string, uint256, uint256, uint256, uint256)
    );
    //require(block.number < deadline, "Invalid deadline");
    IERC20(paymentToken).transferFrom(attestation.recipient, address(validatorResolver), jobCost);
    validatorResolver.addCollateral(attestation.recipient, paymentToken, jobCost);
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

