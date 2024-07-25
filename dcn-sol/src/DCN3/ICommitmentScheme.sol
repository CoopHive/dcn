pragma solidity 0.8.26;

interface ICommitmentScheme {
  function DOMAIN_SEPARATOR() external returns (bytes32);
  function createCommit(
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory data
  ) external returns (bytes32 hash); 

  function updateCommit(
    uint8[2] memory v,
    bytes32[2] memory r,
    bytes32[2] memory s,
    bytes[2] memory data
  ) external returns (bytes32 hash);
}
