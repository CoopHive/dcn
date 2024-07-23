pragma solidity 0.8.26;
import { ICommitmentScheme } from "./ICommitmentScheme.sol";

contract ExampleCommitmentScheme is ICommitmentScheme {

	uint256 chainId;
	bytes32 DOMAIN_SEPARATOR;

  struct CommitScheme {
    address commiter;
    uint256 commitId;
    bool isBuy;
    uint256 collateral;
    uint256 paymentAmount;
    uint8 status;
  }

	bytes COMMITSCHEME_TYPE = "Commit(uint256 commitId,bool isBuy,uint256 collateral,uint256 paymentAmount,uint8 status)";
	bytes32 COMMITSCHEME_TYPE_HASH = keccak256(COMMITSCHEME_TYPE);

	constructor () {
		uint256 ch;
		assembly {
			ch := chainid()
		}
		DOMAIN_SEPARATOR = keccak256(
			abi.encode(
				keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
				keccak256(bytes("ExampleCommitmentScheme")),
				keccak256(bytes("1")),
				ch,
				address(this)
		)
		);
		chainId = ch;

	}

  function createCommit(
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory data
  ) public payable returns (bytes32 hash) {
    (
      uint256 commitId,
      bool isBuy,
      uint256 collateral,
      uint256 paymentAmount,
      uint8 status
    ) = abi.decode(data, (uint256, bool, uint256, uint256, uint8));
    // equiv as hash = keccak256(data) ?
    hash = keccak256(abi.encode(commitId, isBuy, collateral, msg.value, status));


    require(ecrecover(hash, v, r, s) == msg.sender, "commit must be signed by msg.sender");
    require(msg.value == collateral, "commit must be for full amount");
    require(status == 0, "commit must be in status Pending");
  }

  function executeCommit(
    uint256 commitId,
    uin8 v,
    bytes32 r,
    bytes32 s,
    bytes memory data
  ) public payable return (bytes32 hash) {

  }


}
