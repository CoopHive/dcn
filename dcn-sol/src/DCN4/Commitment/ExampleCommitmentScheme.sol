pragma solidity 0.8.26;

import "./IStatement.sol";
import "./IValidation.sol";
import "./ICommitment.sol";

contract ExampleCommitmentScheme is ICommitment {
  address public collateralValidator;
  struct CommitmentScheme {
    uint256 statementId;
    address validator;
    uint8 v;
    bytes32 r;
    bytes32 s;
    bytes32 hash;
  
  constructor (address _collateralValidator) {
    collateralValidator = _collateralValidator;
  }

  function createCommitment(
    uint256 statementId,
    uint8 v,
    uint256 r,
    uint256 s,
    bytes memory validationData
  ) external view returns (bytes32) {

    IValidation(collateralValidator).confirmValidation{
      value: msg.value
    }(
      statementId,
      v,
      r,
      s,
      validationData
    )
  }
}
