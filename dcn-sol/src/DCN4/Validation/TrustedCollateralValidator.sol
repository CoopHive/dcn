pragma solidity 0.8.26;
import {IValidation} from "./IValidation.sol";
contract TrustedCollateralValidator is IValidation {

  address validationAgent;
  struct ValidationScheme {
    uint256 statementId;
    bool hasCollateral;
  }

  constructor(address _validationAgent) {
    validationAgent = _validationAgent;
  }

  modifier onlyValidationAgent() {
    require(msg.sender == validationAgent, "only validation agent can invoke this");
    _;
  }

  function confirmValidation(
    uint256 statementId,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory validationData
  ) onlyValidationAgent public returns (bytes32 hash) {
    hash = keccak256(validationData);
    require(ecrecover(hash, v,r,s) == validationAgent, "validator must sign this");
    return hash;


  }
}
