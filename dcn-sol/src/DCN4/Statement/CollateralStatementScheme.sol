pragma solidity 0.8.26;

import { IStatementScheme } from "./IStatementScheme.sol";

contract CollateralStatementScheme is IStatementScheme {
  struct StatementScheme {
    bool isBuy;
    uint256 collateral;
    uint256 paymentAmount;
    uint8 status;
    address[] validators;
    uint256 nonce; 
  }

  function createStatement(
    uint256 statementId,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory data
  ) public view returns (bytes32) {
    return bytes32(0);
  }

  modifier onlyDcn() {
    require(msg.sender == dcn, "only dcn");
    _;
  }

  bytes STATEMENTSCHEME_TYPE = "StatementScheme(bool isBuy,uint256 collateral,uint256 paymentAmount,uint8 status,address[] validators,uint256 nonce)";

  bytes32 STATEMENTSCHEME_TYPE_HASH = keccak256(STATEMENTSCHEME_TYPE);

  constructor (address _dcn) {
    uint256 ch;
    assembly {
      ch := chainid()
    }
    DOMAIN_SEPARATOR = keccak256(
      abi.encode(
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
        keccak256(bytes("ExampleStatementScheme")),
        keccak256(bytes("1")),
        ch,
        address(this)
    )
    );
    chainId = ch;
    dcn = _dcn;
  }

  constructor(address _dcn) {
    dcn = _dcn;
  }


  function createStatement(
    uint256 statementId,
    uint256 latestNonce,
    address user,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory data
  ) onlyDcn public payable returns (bytes32 hash) {
    (
      bool isBuy,
      uint256 collateral,
      uint256 paymentAmount,
      uint8 status,
      address[] validators,
      uint256 nonce
    ) = abi.decode(data, (bool, uint256, uint256, uint8, address[], uint256));
    hash = keccak256(data);

    require(ecrecover(hash, v, r, s) == user, "statement not signed by user");
    require(paymentAmount == msg.value, "please state value actually sent");
    require(nonce == latestNonce + 1, "please use next nonce");
    return keccak256(data);
  }



}
