pragma solidity 0.8.26;

import { IValidationScheme } from "./IValidationScheme.sol";


contract ExampleValidationScheme is IValidationScheme {

  uint256 chainId;
  bytes32 public DOMAIN_SEPARATOR;

  struct ValidationScheme {
    uint256 commitId;
  }

  bytes VALIDATIONSCHEME_TYPE = "Validation(uint256 commitId)";
  bytes32 VALIDATIONSCHEME_TYPE_HASH = keccak256(VALIDATIONSCHEME_TYPE);

  constructor () {
    uint256 ch;
    assembly {
      ch := chainid()
    }
    DOMAIN_SEPARATOR = keccak256(
      abi.encode(
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
        keccak256(bytes("ExampleValidationScheme")),
        keccak256(bytes("1")),
        ch,
        address(this)
    )
    );
    chainId = ch;
  }

  function validateCommit(
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory data
  ) public {
    (uint256 commitId) = abi.decode(data, (uint256));
    bytes32 hash = keccak256(abi.encode(commitId));

    require(ecrecover(hash, v, r, s) == msg.sender, "validation must be signed by msg.sender");


  }
}
