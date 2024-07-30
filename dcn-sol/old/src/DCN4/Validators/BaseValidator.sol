pragma solidity 0.8.26;
import "./IValidator.sol";
contract BaseValidator is IValidator {
  address validationAgent;
  
  address collateralValidator;
  address uptimeValidator;
  address replicationValidator;

  struct ValidationScheme {
    uint256 statementId;
    bool hasCollateral;
  }

  constructor(
    address _collateralValidator,
    address _uptimeValidator,
    address _replicationValidator
  ) {
    validationAgent = msg.sender;

    collateralValidator = _collateralValidator;
    uptimeValidator = _uptimeValidator;
    replicationValidator = _replicationValidator;
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
  ) onlyValidationAgent public returns (bytes32 hash) {
    hash = keccak256(validationData);
    require(ecrecover(hash, v,r,s) == validationAgent, "validator must sign this");

  }
}
