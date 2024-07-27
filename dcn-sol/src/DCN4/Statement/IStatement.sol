pragma solidity 0.8.26;

interface IStatement {
  function createStatement(
    uint256 statementId,
    uint256 latestNonce,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory data
  ) external view returns (bytes32);

  
}
