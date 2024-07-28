pragma solidity 0.8.26;

interface IValidationScheme {
  function validateCommit(
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory data
  ) external;
}
