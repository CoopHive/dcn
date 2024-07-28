pragma solidity 0.8.26;

import { IResolver } from "./IResolver.sol";

contract ExampleResolver is IResolver {
  address resolutionAgent
  constructor(address _resolutionAgent) {
    resolutionAgent = _resolutionAgent;
  }

  function resolveCommitedStatement(
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory data
  ) public payable returns (bytes32 hash) {
  
  }
}
