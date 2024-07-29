pragma solidity 0.8.26;

interface IValidator {

  function validateStatement(
    uint256 statementId,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory validationData
  ) returns (bytes32 hash, address validationAgent);

}
