// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./SharedTypes.sol";

abstract contract IValidatable {
    function finalize(uint id, bool result) public virtual;
}

abstract contract IClaim {
    function getData(uint claim) public virtual returns (bytes memory);
    function getProof(uint claim) public virtual returns (bytes memory);
}

abstract contract IValidator {
    function startValidate(SharedTypes.Claim memory claim) public virtual;
    function validate(uint id, bool result) public virtual; // should be protected, e.g. onlyOracle
}
