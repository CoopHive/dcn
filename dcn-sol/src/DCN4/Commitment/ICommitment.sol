pragma solidity 0.8.26;

interface ICommitment {
  function createCommitment(
    uint256 statementId,
    address sender,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory validationData
  ) external returns (bytes32 hash, address validationAgent);
}
