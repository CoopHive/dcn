pragma solidity 0.8.26;

interface IStatement {
  function createStatement(
      uint256 statementId,
      uint256 latestNonce,
      address user,
      uint8 v,
      bytes32 r,
      bytes32 s,
      bytes memory data
      ) external payable returns (bytes32);

  function validateStatement(
      uint256 statementId,
      address baseValidator,
      uint8 v,
      bytes32 r,
      bytes32 s,
      bytes memory data
      ) external payable returns (bytes32);

  function matchStatements(
      uint256[2] memory statementIds,
      uint8 v,
      bytes32 r,
      bytes32 s,
      bytes memory data
      ) external;

}
