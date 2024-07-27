pragma solidity 0.8.26;

interface ICommitment {
  function createCommitment() external view returns (bytes32);
}
