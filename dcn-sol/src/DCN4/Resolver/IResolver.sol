pragma solidity 0.8.26;


interface IResolver {

  function resolveStatement(
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory data
  ) external payable returns (bytes32 hash);
}
