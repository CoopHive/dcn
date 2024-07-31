pragma solidity 0.8.26;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/DCN5/DCN5.sol";
import "../src/DCN5/CollateralResolver.sol";
import {
  IEAS,
  AttestationRequest,
  AttestationRequestData
} from "@ethereum-attestation-service/eas-contracts/IEAS.sol";
import { ISchemaRegistry } from "@ethereum-attestation-service/eas-contracts/ISchemaRegistry.sol";
import { ISchemaResolver } from "@ethereum-attestation-service/eas-contracts/resolver/ISchemaResolver.sol";


contract DCN5Test is Test {
  DCN5 public dcn;
  CollateralResolver public collateralResolver;

  IEAS eas =  IEAS(0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587);
  ISchemaRegistry schemaRegistry = ISchemaRegistry(0xA7b39296258348C78294F95B872b282326A97BDF);

  uint256 forkId;

  Vm.Wallet public dcnDeployer;
  Vm.Wallet public collateralResolverDeployer;

  Vm.Wallet public statementCreator;
  bytes32 statementUid;



  function setUp() public {
    forkId = vm.createFork(vm.envString("ALCHEMY_RPC_URL"), 20407271);
    vm.selectFork(forkId);

    string memory mnemonic = vm.envString("MNEMONIC");

    dcnDeployer = vm.createWallet(vm.deriveKey(mnemonic, 0));
    collateralResolverDeployer = vm.createWallet(vm.deriveKey(mnemonic, 1));
    statementCreator = vm.createWallet(vm.deriveKey(mnemonic, 2));

    vm.prank(collateralResolverDeployer.addr);
    collateralResolver = new CollateralResolver(eas);

    vm.prank(dcnDeployer.addr);
    dcn = new DCN5();
  }

  function prepareSchema() public returns (bytes32 schemaUid) {
    string memory schema = "bool isBuy, uint256 collateral, uint256 paymentAmount, uint8 status, address baseValidator";
    schemaUid =  schemaRegistry.register(
      schema,
      ISchemaResolver(address(collateralResolver)),
      true
    );
  }

  function prepareStatement(bytes32 schemaUid) public returns (bytes32 attestUid) {

    AttestationRequestData memory requestData = AttestationRequestData({
      recipient: address(dcn),
      expirationTime: 0,
      revocable: true,
      refUID: schemaUid,
      data: "",
      value: 0
    });
    AttestationRequest memory request = AttestationRequest({
      schema: schemaUid,
      data: requestData
    });

    attestUid = eas.attest(request); 
    
    console.logBytes32(attestUid);

  }
  function testRegisterSchema() public {
    bytes32 uid = prepareSchema();
    console.logBytes32(uid);
  }


  function attestStatement() public {
    bytes32 uid = prepareSchema();
    bytes32 attestUid = prepareStatement(uid);
    console.logBytes32(attestUid);


  }


}
