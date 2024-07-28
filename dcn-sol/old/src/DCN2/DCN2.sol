pragma solidity 0.8.26;

contract DCN2 {

  event CommitCreated(
    Status indexed status,
    uint256 indexed commitId,
    uint256 indexed counterOfferId,
    address commiter,
    Side side,
    uint256 collateral
  );

  enum Status {
    Pending,
    Open,
    Closed,
    Canceled
  }

  enum Side {
    Buy,
    Sell
  }

  struct Commit {
    uint256 counterOfferId;
    address commiter;
    Side side;
    uint256 collateral;
    Status status;
  }

  uint256 public commitCount;
  mapping(uint256 => Commit) public commits;
  
  error NotCaller(address given, address expected);
  error CollateralMisMatch(uint256 given, uint256 expected);
  error NoCommit(uint256 commitId);
  error CounterOfferNotOpen(uint256 counterOfferId);

  constructor() {}

  function createCommit(Side side, uint256 counterOfferId) public payable {
    Status status = Status.Pending;
    if (counterOfferId != 0) {
      Commit storage counterOfferCommit = commits[counterOfferId];
      if (counterOfferCommit.commiter == address(0)) {
        revert NoCommit(counterOfferId);
      }
      status = Status.Open;
    }

    
    Commit memory commit = Commit({
      counterOfferId: counterOfferId, // 0 if unreferenced
      commiter: msg.sender,
      side: side,
      collateral: msg.value,
      status: status
    });

    commitCount++;
    commits[commitCount] = commit;

    emit CommitCreated(
      commit.status,
      commitCount,
      commit.counterOfferId,
      commit.commiter,
      commit.side,
      commit.collateral
    );

  }

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
}
