pragma solidity 0.8.26;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import "../src/DCN6/resolvers/BuyCollateralResolver.sol";
import "../src/DCN6/resolvers/SellCollateralResolver.sol";
import "../src/DCN6/resolvers/ValidatorResolver.sol";

import {EasUtil} from "../src/EasUtil.sol";


contract DCN6Test is Test {
  uint256 forkId;
  
  Vm.Wallet public deployer;

  Vm.Wallet public demander;
  Vm.Wallet public supplier;
  Vm.Wallet public validator;

  BuyCollateralResolver public buyResolver;
  SellCollateralResolver public sellResolver;
  ValidatorResolver public validatorResolver;

  function setUp() public {
    forkId = vm.createFork(vm.envString("ALCHEMY_RPC_URL"), 20407271);
    vm.selectFork(forkId);

    string memory mnemonic = vm.envString("MNEMONIC");

    deployer = vm.createWallet(vm.deriveKey(mnemonic, 0));
    
    demander = vm.createWallet(vm.deriveKey(mnemonic, 1));
    supplier = vm.createWallet(vm.deriveKey(mnemonic, 2));
    validator = vm.createWallet(vm.deriveKey(mnemonic, 3));

    buyResolver = new BuyCollateralResolver(EasUtil.getEAS());
    sellResolver = new SellCollateralResolver(EasUtil.getEAS());
    validatorResolver = new ValidatorResolver(EasUtil.getEAS());
  }

  function testAttestBuy() public {
    (
      bytes32 buySchemaUID,
      bytes32 sellSchemaUID,
      bytes32 validatorSchemaUID
    ) = EasUtil.prepareDCNSchemas(
      deployer.addr,
      buyResolver,
      sellResolver,
      validatorResolver
    );
    vm.deal(demander.addr, 200 wei);
    vm.startPrank(demander.addr);
    EasUtil.attest(
      buySchemaUID,
      demander.addr,
      "",
      abi.encode(100 wei, 100 wei, validator.addr),
      200 wei
    );
  }

}
