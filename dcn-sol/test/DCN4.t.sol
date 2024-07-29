pragma solidity 0.8.26;

import "forge-std/Test.sol";
import "../src/DCN4/DCN4.sol";
import "../src/Statement/ExampleStatementScheme.sol";
import "../src/Validators/TrustedCollateralValidator.sol";
import "../src/Validators/TrustedUptimeValidator.sol";
import "../src/Validators/TrustedReplicationValidator.sol";
import "../src/Validators/BaseValidator.sol";

contract DCN4Test is Test {
  DCN4 dcn4;
  ExampleStatementScheme exampleStatementScheme; 

  TrustedCollateralValidator trustedCollateralValidator;
  TrustedUptimeValidator trustedUptimeValidator;
  TrustedReplicationValidator trustedReplicationValidator;

  BaseValidator baseValidator;

  Vm.Wallet public dcnDeployer;
  Vm.Wallet public statementDeployer;

  Vm.Wallet public computeDemander;
  Vm.Wallet public computeSupplier;
  
  Vm.Wallet public collateralValidator;
  Vm.Wallet public uptimeValidator;
  Vm.Wallet public replicationValidator;

  Vm.Wallet public baseValidator;

  function setUp() public {
    string memory mnemonic = vm.envString("MNEMONIC");
    dcnDeployer = vm.createWallet(vm.deriveKey(mnemonic, 0));
    statementDeployer = vm.createWallet(vm.deriveKey(mnemonic, 1));

    computeDemander = vm.createWallet(vm.deriveKey(mnemonic, 2));
    computeSupplier = vm.createWallet(vm.deriveKey(mnemonic, 3));

    collateralValidator = vm.createWallet(vm.deriveKey(mnemonic, 4));
    uptimeValidator = vm.createWallet(vm.deriveKey(mnemonic, 5));
    replicationValidator = vm.createWallet(vm.deriveKey(mnemonic, 6));
    
    baseValidator = vm.createWallet(vm.deriveKey(mnemonic, 7));

    {
      vm.prank(dcnDeployer);
      dcn4 = new DCN4();

      vm.prank(statementDeployer);
      exampleStatementScheme = new ExampleStatementScheme(address(dcn4));

      vm.prank(collateralValidator);
      trustedCollateralValidator = new TrustedCollateralValidator(collateralValidator.address);
      
      vm.prank(uptimeValidator);
      trustedUptimeValidator = new TrustedUptimeValidator(uptimeValidator.address);

      vm.prank(replicationValidator);
      trustedReplicationValidator = new TrustedReplicationValidator(replicationValidator.address);

      vm.prank(baseValidator);
      baseValidator = new BaseValidator(baseValidator.address);

    }
  }

  function testCreateStatement() public {}

  function testStartValidation() public {}

  function testCollectCollateral() public {}

}
