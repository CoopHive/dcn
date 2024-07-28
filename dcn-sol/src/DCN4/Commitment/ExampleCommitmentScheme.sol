pragma solidity 0.8.26;

import "../Validation/IValidation.sol";
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
  }
  
  constructor (address _collateralValidator) {
    collateralValidator = _collateralValidator;
  }

  function createCommitment(
    uint256 statementId,
    address sender,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory validationData
  ) public returns (bytes32 hash) {

    hash = IValidation(collateralValidator).confirmValidation(
      statementId,
      v,
      r,
      s,
      validationData
    );
  }
}
