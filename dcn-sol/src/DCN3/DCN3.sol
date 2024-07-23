pragma solidity 0.8.26;
import { ICommitmentScheme } from "./ICommitmentScheme.sol";

contract DCN3 {

	event CommitCreated(
    uint256 indexed commitId,
    address indexed commiter,
		uint8 v,
		bytes32 r,
		bytes32 s,
    bytes32 hash
	);

  event CommitValidated(
    uint256 indexed commitId,
    
  )

  struct Commit {
    uint8 v;
    bytes32 r;
    bytes32 s;
    bytes32 hash;
  }

	uint256 public commitCount;
  mapping(address => mapping ( uint256 => Commit)) public commits;

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
    bytes32 hash = ICommitmentScheme(commitmentScheme).createCommit(v, r, s, data);
		commitCount++;
    Commit memory commit = Commit({
      v: v,
      r: r,
      s: s,
      hash: hash
    })
		commits[commitmentScheme][commitCount] = commit;

		emit CommitCreated(
      commitCount,
      msg.sender,
      v,
      r,
      s,
      hash
		);
	}
  function executeCommit(
    address commitmentScheme,
    uint256 commitId,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory data
  ) public {
    Commit storage commit = commits[commitmentScheme][commitId];
    require(commit.hash != 0, "Commit must exist");
    bytes32 hash = ICommitmentScheme(commitmentScheme).executeCommit(commitId, v, r, s, data);

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
