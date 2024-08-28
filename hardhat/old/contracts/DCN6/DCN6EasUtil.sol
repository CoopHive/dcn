pragma solidity 0.8.26;

import {
  IEAS,
  AttestationRequest,
  AttestationRequestData
} from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import { ISchemaRegistry } from "@ethereum-attestation-service/eas-contracts/contracts/ISchemaRegistry.sol";
import { ISchemaResolver } from "@ethereum-attestation-service/eas-contracts/contracts/resolver/ISchemaResolver.sol";

library DCN6EasUtil {

  function getEAS() public view returns (IEAS) {
    return IEAS(0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587);
  }


  function getSchemaRegistry() public view returns (ISchemaRegistry) {
    return ISchemaRegistry(0xA7b39296258348C78294F95B872b282326A97BDF);
  }

  function attest(
    bytes32 schemaUid,
    address recipient,
    bytes32 refUID,
    bytes memory data,
    uint256 value
  ) public returns (bytes32 attestUID) {

    AttestationRequestData memory requestData = AttestationRequestData({
      recipient: recipient,
      expirationTime: 0,
      revocable: true,
      refUID: refUID,
      data: data,
      value: value
    });
    AttestationRequest memory request = AttestationRequest({
      schema: schemaUid,
      data: requestData
    });
    return getEAS().attest{value:value}(request);
  }

  function register(
    string calldata schema ,
    ISchemaResolver resolver,
    bool revocable
  ) public returns (bytes32 schemaUID) {
    return getSchemaRegistry().register(schema, resolver, revocable);
  }

  function prepareDCNSchemas(
    address deployer,
    ISchemaResolver  buyCollateralResolver,
    ISchemaResolver  sellCollateralResolver,
    ISchemaResolver  validatorResolver
  ) public returns (
    bytes32 buySchemaUID,
    bytes32 sellSchemaUID,
    bytes32 validatorSchemaUID
  ) {
    string memory buySchema = "uint256 amount, uint256 collateralRequested, address validator, uint256 deadline";
    string memory sellSchema = "uint256 collateral, address validator";
    string memory validatorSchema = "bool isApproved";

    buySchemaUID = getSchemaRegistry().register(
      buySchema, buyCollateralResolver, true
    );
    sellSchemaUID = getSchemaRegistry().register(
      sellSchema, sellCollateralResolver, true
    );
    validatorSchemaUID = getSchemaRegistry().register(
      validatorSchema, validatorResolver, true
    );
  }



}
