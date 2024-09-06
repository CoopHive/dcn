const { StarboardVerify, generateMetadata  } = require('@starboardventures/hardhat-verify/dist/src/utils')

async function verify() {
  const verify = new StarboardVerify({
    network: 'Calibration',
    contractName: 'BuyCollateralResolver',
   contractAddress: '0xA029EC090B2f553C94C858E7BA204E3a5b0363Fe' ,

  })
  await generateMetadata('BuyCollateralResolver') // optional
  await verify.verify()

}
verify();
