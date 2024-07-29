pragma solidity 0.8.26;

import { IStatement } from "./IStatement.sol";
import "forge-std/console.sol";
contract ExampleStatementScheme is IStatement {

  struct StatementScheme {
    bool isBuy;
    uint256 collateral;
    uint256 paymentAmount;
    uint8 status;
    address baseValidator;
    uint256 nonce; 
  }

  bytes public STATEMENTSCHEME_TYPE = "StatementScheme(bool isBuy,uint256 collateral,uint256 paymentAmount,uint8 status,address baseValidator,uint256 nonce)";

  bytes32 public STATEMENTSCHEME_TYPE_HASH = keccak256(STATEMENTSCHEME_TYPE);
  bytes32 public DOMAIN_SEPARATOR; 
  address public dcn;

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
    dcn = _dcn;
  }

  modifier onlyDcn() {
    require(msg.sender == dcn, "only dcn");
    _;
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
    console.log('hi');
    (
      bool isBuy,
      uint256 collateral,
      uint256 paymentAmount,
      uint8 status,
      address baseValidator,
      uint256 nonce
    ) = abi.decode(data, (bool, uint256, uint256, uint8, address, uint256));

    hash = keccak256(abi.encodePacked(
      "\x19\x01",
      DOMAIN_SEPARATOR,
      keccak256(
        abi.encode(
          STATEMENTSCHEME_TYPE_HASH,
          isBuy,
          collateral,
          paymentAmount,
          status,
          baseValidator,
          nonce
        )
      )
    ));
    console.log(ecrecover(hash, v, r, s));
    console.log('user', user);
    require(ecrecover(hash, v, r, s) == user, "only user");
    //require(paymentAmount == msg.value, "please state value actually sent");
    //require(nonce == latestNonce + 1, "please use next nonce");
  }

  /* specific logic to matching */

  function validateStatement(
    uint256 statementId,
    address baseValidator,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes  memory data
  ) onlyDcn public payable returns (bytes32) {

  } 

  function matchStatements(
    uint256[2] memory statementIds,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory data
  ) onlyDcn public {

  }
}
