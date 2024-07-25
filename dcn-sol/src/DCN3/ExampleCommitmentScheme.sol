pragma solidity 0.8.26;
import { ICommitmentScheme } from "./ICommitmentScheme.sol";

contract ExampleCommitmentScheme is ICommitmentScheme {

	uint256 chainId;
	bytes32 public DOMAIN_SEPARATOR;
  address dcn;
  // status 
  // 0 = Pending
  // 1 = Open
  // 2 = Validating
  // 3 = Closed
  // 4 = Canceled
  struct CommitScheme {
    bool isBuy;
    uint256 collateral;
    uint256 paymentAmount;
    uint8 status;
    uint256 nonce;
  }

	bytes COMMITSCHEME_TYPE = "CommitScheme(bool isBuy,uint256 collateral,uint256 paymentAmount,uint8 status,uint256 nonce)";
	bytes32 COMMITSCHEME_TYPE_HASH = keccak256(COMMITSCHEME_TYPE);

	constructor (address _dcn) {
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
    dcn = _dcn;
	}

  modifier onlyDcn() {
    require(msg.sender == dcn, "only dcn");
    _;
  }

  function createCommit(
    uint256 commitId,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory data,
    uint256 latestNonce
  ) onlyDcn public returns (bytes32 hash) {
    (
      bool isBuy,
      uint256 collateral,
      uint256 paymentAmount,
      uint8 status,
      uint256 nonce
    ) = abi.decode(data, (bool, uint256, uint256, uint8, uint256));
    require(latestNonce + 1 == nonce, "nonce must increment");
    // equiv as hash = keccak256(data) ?
    hash = keccak256(abi.encode(isBuy, collateral, paymentAmount, status));
    
    require(ecrecover(hash, v, r, s) == msg.sender, "commit must be signed by msg.sender");
    //require(msg.value == collateral, "commit must be for full amount");
    require(status == 0, "commit must be in status Pending");
  }

  function updateCommit(
    uint256 commitId,
    uint8[2] memory v,
    bytes32[2] memory r,
    bytes32[2] memory s,
    bytes[2] memory data,
    uint256 latestNonce
  ) public returns (bytes32 hash) {

    (
      uint256 iCommitId,
      ,
      ,
      ,
      uint8 iStatus
    ) = abi.decode(data[0], (uint256, bool, uint256, uint256, uint8));
    (
      uint256 fCommitId,
      ,
      ,
      ,
      uint8 fStatus
    ) = abi.decode(data[1], (uint256, bool, uint256, uint256, uint8));

    require(ecrecover(keccak256(data[0]), v[0], r[0], s[0]) == msg.sender && ecrecover(keccak256(data[1]), v[1], r[1], s[1]) == msg.sender, "commit must be signed by msg.sender");
    require(
      iCommitId == fCommitId
    , "commit must be for same commit ID");
    if (iStatus == 0 && fStatus == 1) {
      // opening bid
    } else if (iStatus == 1 && fStatus == 2) {
      // validating bid
    } else if (iStatus == 2 && fStatus == 3) {
      // closing bid
    } else {
      if (fStatus == 4) {
        // canceling bid
      }
    }
  }
}
