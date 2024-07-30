pragma solidity 0.8.26;
import "./IValidator.sol";

contract TrustedReplicationValidator is IValidator {
  address validationAgent;

  struct ValidationScheme {
    uint256 statementId;
    bool hasCollateral;
  }



  constructor() {
    validationAgent = msg.sender;
  }

  modifier onlyValidationAgent() {
    require(msg.sender == validationAgent, "only validation agent can invoke this");
    _;
  }

  function validateStatement(
    uint256 statementId,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory validationData
  ) onlyValidationAgent public returns (bytes32 hash ) {
    hash = keccak256(validationData);
    require(ecrecover(hash, v,r,s) == validationAgent, "validator must sign this");

  }
}
