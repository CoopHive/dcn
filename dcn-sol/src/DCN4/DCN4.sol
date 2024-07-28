pragma solidity 0.8.26;

import { IStatement } from "./Statement/IStatement.sol";
import { IValidation } from "./Validation/IValidation.sol";
import { ICommitment } from "./Commitment/ICommitment.sol";
import { IResolver } from "./Resolver/IResolver.sol";

contract DCN4 {
  event StatementCreated(
    uint256 indexed statementId,
    address indexed stater,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes32 hash
  );

  struct Statement {
    uint8 v;
    bytes32 r;
    bytes32 s;
    bytes32 hash;
  }
  uint256 statementCount;
  // commitscheme 
  mapping(address => mapping(uint256 => Statement)) public statements;
  mapping (address => uint256) usedNonces;

  struct CommitedStatement {
    uint256 statementId;
    uint8 v;
    bytes32 r;
    bytes32 s;
    bytes32 hash;
  }
  // statementId => validator address => Commit
  mapping(address => mapping(address => Commit)) public commitedStatements;

  struct ResolvedStatement {
    uint256 statementId;
    uint8 v;
    bytes32 r;
    bytes32 s;
    bytes32 hash;
  }
  constructor() {}

  function createStatement(
    address statementScheme,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory data
  ) public payable {
    (bytes32 hash) = IStatement(statementScheme).createStatement{
      value: msg.value
    }(
      statementCount,
      usedNonces[msg.sender],
      msg.sender,
      v, r, s, data
    );
    statements[statementScheme][statementCount] = Statement(v,r,s,hash);
    usedNonces[msg.sender]++;
    statementCount++;

    emit StatementCreated(
      statementCount,
      msg.sender,
      v,
      r,
      s,
      hash
    );
  }

  function commitStatement(
    address statementScheme,
    uint256 statementId,
    bytes memory statementData,
    address commitmentScheme,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory validationData
  ) public {
    Statement memory statement = statements[statementScheme][statementId];
    require(statement.hash != 0, "statement not found");

    (bytes32 hash, address validationAgent) = ICommitment(commitmentScheme).createCommitment(
      statementId,
      msg.sender,
      v, r, s, validationData
    );

    commitments[commitmentScheme][validationAgent] = Commitment(
      statementId,
      v,
      r,
      s,
      hash
    );
  }

  function resolveStatement(
    uint256 commitmentId,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory resolveData
  ) public {
    Commitment memory commitment = commitments[msg.sender][commitmentId];
    require(commitment.hash != 0, "commitment not found");
    I
    
}
