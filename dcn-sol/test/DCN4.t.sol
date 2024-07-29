pragma solidity 0.8.26;

import "forge-std/Test.sol";
import "../src/DCN4/DCN4.sol";
import "../src/DCN4/Statement/ExampleStatementScheme.sol";
import "../src/DCN4/Validators/TrustedCollateralValidator.sol";
import "../src/DCN4/Validators/TrustedUptimeValidator.sol";
import "../src/DCN4/Validators/TrustedReplicationValidator.sol";
import "../src/DCN4/Validators/BaseValidator.sol";

contract DCN4Test is Test {
  DCN4 dcn4;
  ExampleStatementScheme exampleStatementScheme; 

  TrustedCollateralValidator trustedCollateralValidator;
  TrustedUptimeValidator trustedUptimeValidator;
  TrustedReplicationValidator trustedReplicationValidator;

  BaseValidator trustedBaseValidator;

  Vm.Wallet public dcnDeployer;
  Vm.Wallet public statementDeployer;

  Vm.Wallet public demander;
  Vm.Wallet public supplier;
  
  Vm.Wallet public collateralValidator;
  Vm.Wallet public uptimeValidator;
  Vm.Wallet public replicationValidator;

  Vm.Wallet public baseValidator;

  function setUp() public {
    string memory mnemonic = vm.envString("MNEMONIC");
    dcnDeployer = vm.createWallet(vm.deriveKey(mnemonic, 0));
    statementDeployer = vm.createWallet(vm.deriveKey(mnemonic, 1));

    demander = vm.createWallet(vm.deriveKey(mnemonic, 2));
    supplier = vm.createWallet(vm.deriveKey(mnemonic, 3));

    collateralValidator = vm.createWallet(vm.deriveKey(mnemonic, 4));
    uptimeValidator = vm.createWallet(vm.deriveKey(mnemonic, 5));
    replicationValidator = vm.createWallet(vm.deriveKey(mnemonic, 6));
    
    baseValidator = vm.createWallet(vm.deriveKey(mnemonic, 7));

    {
      vm.prank(dcnDeployer.addr);
      dcn4 = new DCN4();

      vm.prank(statementDeployer.addr);
      exampleStatementScheme = new ExampleStatementScheme(address(dcn4));

      vm.prank(collateralValidator.addr);
      trustedCollateralValidator = new TrustedCollateralValidator();
      
      vm.prank(uptimeValidator.addr);
      trustedUptimeValidator = new TrustedUptimeValidator();

      vm.prank(replicationValidator.addr);
      trustedReplicationValidator = new TrustedReplicationValidator();

      vm.prank(baseValidator.addr);
      trustedBaseValidator = new BaseValidator(
        address(trustedCollateralValidator),
        address(trustedUptimeValidator),
        address(trustedReplicationValidator)
      );

    }
  }

  function testCreateStatement() public {
    vm.startPrank(demander.addr);
    {
      ExampleStatementScheme.StatementScheme memory statement = ExampleStatementScheme.StatementScheme({
        isBuy: true,
        collateral: 100,
        paymentAmount: 200,
        status: 0,
        baseValidator: address(trustedBaseValidator),
        nonce: dcn4.usedNonces(demander.addr) + 1
      });  
      bytes32 structHash = keccak256(
        abi.encode(
          exampleStatementScheme.STATEMENTSCHEME_TYPE_HASH(),
          statement.isBuy,
          statement.collateral,
          statement.paymentAmount,
          statement.status,
          statement.baseValidator,
          statement.nonce
        )
      );
      bytes32 digest = keccak256(
        abi.encodePacked(
          "\x19\x01",
          exampleStatementScheme.DOMAIN_SEPARATOR(),
          structHash
        )
      );

      (uint8 v, bytes32 r, bytes32 s) = vm.sign(demander.privateKey, digest);
      console.log('v', v);
      console.logBytes32(r);
      console.logBytes32(s);
      vm.deal(demander.addr, 1 ether);
      dcn4.createStatement{value: statement.collateral}(address(exampleStatementScheme), v, r, s, abi.encode(
        statement.isBuy,
        statement.collateral,
        statement.paymentAmount,
        statement.status,
        statement.baseValidator,
        statement.nonce
      ));

      
    }
  }

  function testStartValidation() public {}

  function testCollectCollateral() public {}

}
