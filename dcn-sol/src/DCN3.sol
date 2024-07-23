pragma solidity 0.8.26;

contract ExampleCommitmentScheme {

	uint256 chainId;
	bytes32 DOMAIN_SEPARATOR;

  struct CommitScheme {
    address commiter;
    uint256 commitId;
    bool isBuy;
    uint256 collateral;
    uint8 status;
  }

	bytes COMMITSCHEME_TYPE = "Commit(uint256 commitId,bool isBuy,uint256 collateral,uin8 status)";
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
  ) payable {
    (uint256 commitId, bool isBuy, uint256 collateral, uint8 status) = abi.decode(data, (uint256, bool, uint256, uint8));

    bytes32 hash = keccak256(abi.encode(commitId, isBuy, collateral, status));

    require(ecrecover(hash, v, r, s) == msg.sender, "commit must be signed by msg.sender");
    require(msg.value == collateral, "commit must be for full amount");
    require(status == 0, "commit must be in status Pending");

    Commit memory commit = Commit({commiter:msg.sender, commitId, isBuy, collateral, status});
    emit CommitCreated(v, r, s);
    return hash;
  }

}

contract DCN3 {

	event CommitCreated(
    uint256 indexed commitId,
    address indexed commiter,
		uint8 v,
		bytes32 r,
		bytes32 s,
    bytes32 hash
	);

  struct Commit {
    uint8 v;
    bytes32 r;
    bytes32 s;
    bytes32 hash;
  }

	uint256 public commitCount;
	mapping(uint256 => Commit) public commits;

	error NotCaller(address given, address expected);
	error CollateralMisMatch(uint256 given, uint256 expected);
	error NoCommit(uint256 commitId);
	error CounterOfferNotOpen(uint256 counterOfferId);

	constructor() {}

	function createCommit(
    address commitmentScheme,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory data
	) public payable {
    bytes32 hash = ExampleCommitmentScheme(commitmentScheme).createCommit(v, r, s, data);
		commitCount++;
    Commit memory commit = Commit({
      v: v,
      r: r,
      s: s,
      hash: hash
    })
		commits[commitCount] = commit;

		emit CommitCreated(
      commitCount,
      msg.sender,
      v,
      r,
      s,
      hash
		);

	}
/*
	function cancel(uint256 commitId) public {
		Commit storage commit = commits[commitId];
		if (commit.commiter == address(0) ) { 
			revert NoCommit(commitId);
		}
		if (msg.sender != commit.commiter) {
			revert NotCaller(msg.sender, commit.commiter);
		}
		commit.status = Status.Canceled;
	}

	function exercise(uint256 commitId) public {
		Commit storage commit = commits[commitId];
		if (commit.commiter == address(0)) { 
			revert NoCommit(commitId);
		}
		if (msg.sender != commit.commiter) {
			revert NotCaller(msg.sender, commit.commiter);
		}

		if (commit.status == Status.Pending) {
			commit.status = Status.Open;
			return;
		} else if (commit.status == Status.Open) {
			Commit memory counterOffer = commits[commit.counterOfferId];
			if (counterOffer.commiter == address(0)) {
				revert NoCommit(commit.counterOfferId);
			}
			if (counterOffer.status == Status.Open) {
				// fully optimistic, would set Status.Validating set here and a third party validator set to Status.Close in a different tx
				// self checkout style
				counterOffer.status = Status.Closed;
				commit.status = Status.Closed; 
			} else {
				revert CounterOfferNotOpen(commit.counterOfferId);
			}

		}
	}

	function withdraw(uint256 commitId) public {
		Commit storage commit = commits[commitId];
		if (commit.commiter == address(0)) { 
			revert NoCommit(commitId);
		}
		if (msg.sender != commit.commiter) {
			revert NotCaller(msg.sender, commit.commiter);
		}

		Commit storage counterOfferCommit = commits[commit.counterOfferId];
		if (counterOfferCommit.commiter == address(0)) {
			revert NoCommit(commit.counterOfferId);
		}

		if (commit.status == Status.Closed && counterOfferCommit.status == Status.Closed) {
			payable(commit.commiter).transfer(commit.collateral);
			payable(counterOfferCommit.commiter).transfer(counterOfferCommit.collateral);
		}
		if (commit.status == Status.Canceled) {
			payable(commit.commiter).transfer(commit.collateral);
		}

	}
  */
}
