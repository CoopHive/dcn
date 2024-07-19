pragma solidity 0.8.26;

import "forge-std/Test.sol";
import {DCNBidClaim, DCNDeal} from "../src/DCN.sol";
import "forge-std/console.sol";
contract testDCNDeal is Test {
  DCNDeal dcnDeal;
  DCNBidClaim dcnBidClaim;
  Vm.Wallet public deployer;
  Vm.Wallet public bidderOne;
  function setUp() public {
    string memory mnemonic = vm.envString("MNEMONIC");
    deployer = vm.createWallet(vm.deriveKey(mnemonic, 0));
    vm.startPrank(deployer.addr);
    dcnDeal = new DCNDeal();
    dcnBidClaim = new DCNBidClaim();
    vm.stopPrank();
  }

  function testState() public {
    console.log(address(dcnDeal));
    console.log(address(dcnDeal.askValidator()));
    console.log(address(dcnDeal.bidValidator()));
    console.log(address(dcnBidClaim));
  }

  function testMakeBid() public {
    vm.startPrank(bidderOne.addr);
    dcnBidClaim.makeBid{value: 100 wei}(100, address(dcnDeal));
    vm.stopPrank();
  }
}
