pragma solidity 0.8.26;

import "forge-std/Test.sol";
import {DCNDeal} from "../src/DCN.sol";
import "forge-std/console.sol";
contract testDCNDeal is Test {
  DCNDeal public dcnd;
  Vm.Wallet public deployer;
  function setUp() public {
    string memory mnemonic = vm.envString("MNEMONIC");
    deployer = vm.createWallet(vm.deriveKey(mnemonic, 0));
    vm.startPrank(deployer.addr);
    dcnd = new DCNDeal();
    vm.stopPrank();
  }

  function testState() public {
    console.log(dcnd.bidValidator.address);
    console.log(dcnd.askValidator.address);
  }
}
