pragma solidity 0.8.26;

interface IValidation {

  function confirmValidation(
    uint256 statementId,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory validationData
  ) external returns (bytes32);
}
