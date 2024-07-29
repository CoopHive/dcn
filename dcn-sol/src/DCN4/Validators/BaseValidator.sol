pragma solidity 0.8.26;
import "../IValidator.sol";
contract BaseValidator is IValidator {
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

  function validateStatement(
    uint256 statementId,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory validationData
  ) onlyValidationAgent public returns (bytes32 hash, address validationAgent) {
    hash = keccak256(validationData);
    require(ecrecover(hash, v,r,s) == validationAgent, "validator must sign this");
    return (hash, validationAgent);

  }
}
