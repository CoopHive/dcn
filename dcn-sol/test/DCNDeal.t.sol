pragma solidity 0.8.26;

import "forge-std/Test.sol";
import {DCNBidClaim, DCNAskClaim, DCNDeal} from "../src/DCN.sol";
import "forge-std/console.sol";
contract testDCNDeal is Test {
  DCNDeal dcnDeal;
  DCNBidClaim dcnBidClaim;
  DCNAskClaim dcnAskClaim;
  Vm.Wallet public deployer;
  Vm.Wallet public bidderOne;
  Vm.Wallet public askerOne;
  function setUp() public {
    string memory mnemonic = vm.envString("MNEMONIC");

    deployer = vm.createWallet(vm.deriveKey(mnemonic, 0));
    bidderOne = vm.createWallet(vm.deriveKey(mnemonic, 1));
    askerOne = vm.createWallet(vm.deriveKey(mnemonic, 2));

    vm.startPrank(deployer.addr);
    {
      dcnDeal = new DCNDeal();
      dcnBidClaim = new DCNBidClaim();
      dcnAskClaim = new DCNAskClaim();
    }
    vm.stopPrank();
  }

  function testLogState() public {
    console.log("===============");
    console.log("Contract Addrs");
    console.log("DCNDeal     :", address(dcnDeal));
    console.log("AskValidator:", address(dcnDeal.askValidator()));
    console.log("BidValidator:", address(dcnDeal.bidValidator()));
    console.log("BidClaim    :", address(dcnBidClaim));
    console.log("AskClaim    :", address(dcnAskClaim));
    console.log("===============");
    console.log("User Addrs   ");
    console.log("===============");
    console.log("deployer    :", deployer.addr);
    console.log("bidderOne   :", bidderOne.addr);
    console.log("askerOne    :", askerOne.addr);
    console.log("===============");
  }

  function testMakeBidClaim() public {
    vm.startPrank(bidderOne.addr);
    {
      vm.deal(bidderOne.addr, 100 wei);
      dcnBidClaim.makeBid{value: 100 wei}(100, address(dcnDeal));
    }
    vm.stopPrank();

    assertEq(dcnBidClaim.claimCount(), 1);
    assertEq(
      dcnBidClaim.claims(1),
      keccak256(abi.encodePacked(
        address(dcnDeal),
        uint(100)
      ))
    );
    assertEq(dcnBidClaim.creator(1), bidderOne.addr);
  }

  function testMakeAskClaim() public {
    bytes32 dealHash = keccak256(abi.encodePacked(
      address(dcnDeal),
      uint(100)
    ));
    vm.startPrank(askerOne.addr);
    {
      uint256 id = dcnAskClaim.makeAsk(dealHash);
      assertEq(id, 1);
    }
    vm.stopPrank();

    assertEq(dcnAskClaim.claimCount(), 1);
    assertEq(
      dcnAskClaim.claims(1),
      dealHash
    );
    assertEq(dcnAskClaim.creator(1), askerOne.addr);
  }

  function prepareDeal() public {
    uint value = 100 wei;
    uint credits = 100;
    bytes32 bidHash = keccak256(abi.encodePacked(
      address(dcnDeal),
      credits
    )); 
    vm.startPrank(bidderOne.addr);
    {
      vm.deal(bidderOne.addr, value);
      dcnBidClaim.makeBid{value: value}(credits, address(dcnDeal));
    }
    vm.stopPrank();

    vm.startPrank(askerOne.addr);
    {
      vm.deal(askerOne.addr, value);
      dcnAskClaim.makeAsk(bidHash);
    }
    vm.stopPrank();
  }




  function testFinalizeDeal() public {
    prepareDeal();

    vm.startPrank(bidderOne.addr);
    // Finalize step question, is this the kafka ordering service running as validator?
    vm.stopPrank();

  }
}
