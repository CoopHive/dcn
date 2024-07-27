pragma solidity 0.8.26;

contract TrustedCollateralValidator is IValidation {
  address validationAgent;
  struct ValidationScheme {
    uint256 statementId;
    bool hasCollateral;
  }

  constructor(address _validationAgent) {}

  function confirmValidation(
    uint256 statementId,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory validationData
  ) {
    require(ecrecover(v, r, s, validationData) == validationAgent, "validator must sign this");
    return keccak256(validationData);


  }
}
