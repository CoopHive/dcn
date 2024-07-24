pragma solidity 0.8.26;

import { DCN3 } from "../src/DCN3.sol";
import { ExampleCommitmentScheme  } from "../src/DCN3/ExampleCommitmentScheme.sol";
import { ExampleValidationScheme } from "../src/DCN3/ExampleValidationScheme.sol";

import "forge-std/Test.sol";
import "forge-std/console.sol";

contract testDCN3 is Test {
  DCN3 dcn3;
  ICommitmentScheme commitmentScheme;
  IValidationScheme validationScheme;
  Vm.Wallet public deployer;
  Vm.Wallet public demanderOne;
  Vm.Wallet public supplierOne;

  function setUp() public {
    string memory mnemonic = vm.envString("MNEMONIC");

    deployer = vm.createWallet(vm.deriveKey(mnemonic, 0));
    demanderOne = vm.createWallet(vm.deriveKey(mnemonic, 1));
    supplierOne = vm.createWallet(vm.deriveKey(mnemonic, 2));

    vm.startPrank(deployer.addr);
    {
      commitmentScheme = new ExampleCommitmentScheme();
      validationScheme = new ExampleValidationScheme();
      dcn3 = new DCN3();
    }
    vm.stopPrank();

  }

  function testCreateCommit() public {
    vm.startPrank(demanderOne.addr)
    {
      bytes COMMITSCHEME_TYPE = "Commit(bool isBuy,uint256 collateral,uint256 paymentAmount,uint8 status)";
      bytes32 COMMITSCHEME_TYPE_HASH = keccak256(COMMITSCHEME_TYPE);
      ExampleCommitmentScheme.Commit memory commitment = ExampleCommitmentScheme.Commit({
        isBuy: true,
        collateral: 100,
        paymentAmount: 200,
        status: 0
      });  
      bytes32 structHash = keccak256(
        abi.encode(
          COOMMITSCHEME_TYPE_HASH,
          commitment.isBuy,
          commitment.collateral,
          commitment.paymentAmount,
          commitment.status
        )
      )
      );

      bytes32 digest = keccak256(
        abi.encodePacked(
          "\x19\x01",
          commitmentScheme.DOMAIN_SEPARATOR,
          structHash
      )
      );

      (uint8 v, bytes32 r, bytes32 s) = vm.sign(dmeanderOne.privateKey, digest);

      dcn3.createCommit(address(commitmentScheme), v, r, s, abi.encode(
        commitment.isBuy,
        commitment.collateral,
        commitment.paymentAmount,
        commitment.status
      ));

      
    }
  }
}

