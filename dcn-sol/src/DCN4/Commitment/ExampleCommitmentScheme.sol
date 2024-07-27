pragma solidity 0.8.26;

import "./IStatement.sol";
import "./IValidation.sol";
import "./ICommitment.sol";

contract ExampleCommitmentScheme is ICommitment {

  struct CommitmentScheme {
    uint256 statementId;
    address validator;
    uint8 v;
    bytes32 r;
    bytes32 s;
    bytes32 hash;
  }
  constructor () {

  }

  function createCommitment(

  ) external view returns (bytes32) {
    return bytes32(0x0);    
  }
}
