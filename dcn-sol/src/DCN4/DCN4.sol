pragma solidity 0.8.26;

import { IStatementScheme } from "./IStatementScheme.sol";
import { IValidationScheme } from "./IValidationScheme.sol";

contract DCN4 {
  event StatementCreated(
    uint256 indexed statementId,
    address indexed stater,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes32 hash
  )
  struct Statement {
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes32 hash
  }
  uint256 statementCount;
  // commitscheme 
  mapping(address => mapping(uint256 => Statement)) public statements;
  mapping (address => uint256) usedNonces;

  struct Commit {
    bool isAuthorized;
    bytes data;
  }
  // statementId => validator address => Commit
  mapping(address mapping(address => Commit)) public commits;

  constructor() {}

  function createStatement(
    address statementScheme,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory data
  ) public payable {
    (bytes32 hash) = IStatementScheme(statementScheme).createStatement{
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

  function createValidation(

  )

  function createCommit(
    address statementScheme,
    uint256 statementId,
    bytes memory statementData
    address commitmentScheme,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory commitData
  ) public {
    Statement memory statement = statements[statementScheme][statementId];
    require(statement.hash != 0, "statement not found");

    ICommitScheme(commitmentScheme).createCommit{
      value: msg.value
    }(
      
    )
  }


}
