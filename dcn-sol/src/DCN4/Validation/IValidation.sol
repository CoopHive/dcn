pragma solidity 0.8.26;

interface IValidation {

  function startValidate() external payable;
  function validate() external view returns (bool);
}
