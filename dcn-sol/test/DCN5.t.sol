pragma solidity 0.8.26;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/DCN5/DCN5.sol";
import { IEAS } from "@ethereum-attestation-service/eas-contracts/IEAS.sol";
import { ISchemaRegistry } from "@ethereum-attestation-service/eas-contracts/ISchemaRegistry.sol";

contract DCN5Test is Test {
  //DCN5 dcn;
  uint256 forkId;

  Vm.Wallet public dcnDeployer;

  IEAS eas =  IEAS(0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587);
  ISchemaRegistry schemaRegistry = ISchemaRegistry(0xA7b39296258348C78294F95B872b282326A97BDF);


  function setUp() public {
    forkId = vm.createFork(vm.envString("ALCHEMY_RPC_URL"), 20407271);
    vm.selectFork(forkId);
    
    string memory mnemonic = vm.envString("MNEMONIC");
    dcnDeployer = vm.createWallet(vm.deriveKey(mnemonic, 0));
  }


  function testRegisterSchema() public {

  }

}
