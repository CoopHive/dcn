
// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import { DCNDeal } from "../src/DCN.sol";
contract DeployScript is Script {
  function setUp() public {}

  function run() public {
    string memory mnemonic = vm.envString("MNEMONIC");
    uint privateKey = vm.deriveKey(mnemonic, 0);

    
    vm.startBroadcast(privateKey);
    DCNDeal dcn = new DCNDeal();
    vm.stopBroadcast();
  }
}
