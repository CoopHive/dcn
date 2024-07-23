pragma solidity 0.8.26;

interface ICommitmentScheme {
  function createCommit(
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory data
  ) payable;

  function executeCommit(
    uint256 commitId,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory data
  ) payable;
}
