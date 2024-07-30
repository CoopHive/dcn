pragma solidity 0.8.26;

import { IStatement } from "./Statement/IStatement.sol";
import { IValidator } from "./Validators/IValidator.sol";

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
    // statementscheme => statementId => Statement 
  mapping (address => mapping(uint256 => Statement)) public statements;
  mapping (address => uint256) public usedNonces;

  struct ValidatedStatement {
    uint256 statementId;
    uint8 v; // validator signature params
    bytes32 r;
    bytes32 s;
    bytes32 hash; //from validator
  }
  // statementscheme => statementId => validationOfStatement
  mapping (address => mapping(uint256 => ValidatedStatement)) public validatedStatements;



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

  function validateStatement(
    uint256 statementId,
    address baseValidator,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory data
  ) public payable {

    IValidator(baseValidator).validateStatement(
      statementId,
      v,
      r,
      s,
      data
    );
  }

  function matchStatements(
    uint256[2] memory statementIds,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory data
  ) public payable returns (bytes32) {

    // check for existence of statements
    // check if they are validated
    // execute match logic
  }
}
