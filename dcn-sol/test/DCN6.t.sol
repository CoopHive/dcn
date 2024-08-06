pragma solidity 0.8.26;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import "../src/DCN6/resolvers/BuyCollateralResolver.sol";
import "../src/DCN6/resolvers/SellCollateralResolver.sol";
import "../src/DCN6/resolvers/TrustedValidatorResolver/TrustedValidatorResolver.sol";

import {EasUtil} from "../src/EasUtil.sol";


contract DCN6Test is Test {
  uint256 forkId;
  
  Vm.Wallet public deployer;

  Vm.Wallet public demander;
  Vm.Wallet public supplier;
  Vm.Wallet public validator;

  BuyCollateralResolver public buyResolver;
  SellCollateralResolver public sellResolver;
  TrustedValidatorResolver public trustedValidatorResolver;

  bytes32 public buySchemaUID;
  bytes32 public sellSchemaUID;
  bytes32 public validatorSchemaUID;

  function setUp() public {
    forkId = vm.createFork(vm.envString("ALCHEMY_RPC_URL"), 20407271);
    vm.selectFork(forkId);

    string memory mnemonic = vm.envString("MNEMONIC");

    deployer = vm.createWallet(vm.deriveKey(mnemonic, 0));
    
    demander = vm.createWallet(vm.deriveKey(mnemonic, 1));
    supplier = vm.createWallet(vm.deriveKey(mnemonic, 2));
    validator = vm.createWallet(vm.deriveKey(mnemonic, 3));

    trustedValidatorResolver = new TrustedValidatorResolver(EasUtil.getEAS(), validator.addr);
    
    buyResolver = new BuyCollateralResolver(EasUtil.getEAS(), address(trustedValidatorResolver));
    sellResolver = new SellCollateralResolver(EasUtil.getEAS(), address(trustedValidatorResolver));

    vm.prank(validator.addr);
    trustedValidatorResolver.setBuyCollateralResolver(address(buyResolver));
    vm.prank(validator.addr);
    trustedValidatorResolver.setSellCollateralResolver(address(sellResolver));

    ( 
      buySchemaUID,
      sellSchemaUID,
      validatorSchemaUID
    ) = EasUtil.prepareDCNSchemas(
      deployer.addr,
      buyResolver,
      sellResolver,
      trustedValidatorResolver
    );
  }

  function prepareAttestBuy(
    address buyer,
    uint256 collateralRequested,
    uint256 purchaseAmount
  ) public  returns (bytes32 buyUID) {
    vm.deal(buyer,  purchaseAmount);
    buyUID = EasUtil.attest(
      buySchemaUID,
      buyer,
      "",
      abi.encode(purchaseAmount, collateralRequested, validator.addr, block.number + 100),
      purchaseAmount 
    );

  }

  function prepareAttestSell(
    bytes32 buyerAttestationUID,
    address seller,
    uint256 collateral

  ) public returns (bytes32 sellUID) {
    vm.deal(seller, collateral);
    sellUID = EasUtil.attest(
      sellSchemaUID,
      seller,
      buyerAttestationUID,
      abi.encode(collateral, validator.addr),
      collateral
    );
  }

  function prepareAttestValidation(
    bytes32 sellerAttestationUID,
    bool isApproved
  ) public returns (bytes32 validationUID) {
    EasUtil.attest(
      validatorSchemaUID,
      validator.addr,
      sellerAttestationUID,
      abi.encode(isApproved),
      0
    );
    
  }

  function testAttestBuy() public {
    vm.prank(demander.addr);
    bytes32 buyUID = prepareAttestBuy(demander.addr,  100 wei, 100 wei);
  }

  function testAttestSell() public {
    vm.prank(demander.addr);
    bytes32 buyUID = prepareAttestBuy(demander.addr, 100 wei, 100 wei);
    vm.prank(supplier.addr);
    prepareAttestSell(buyUID, supplier.addr, 100 wei);
  }

  function testAttestValidate() public {
    vm.prank(demander.addr);
    bytes32 buyUID = prepareAttestBuy(demander.addr, 100 wei, 100 wei);
    vm.prank(supplier.addr);
    bytes32 sellUID = prepareAttestSell(buyUID, supplier.addr, 100 wei);
    vm.prank(validator.addr);
    prepareAttestValidation(sellUID, true);
  }
}
