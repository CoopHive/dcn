

import hre from 'hardhat';

import { getContract, parseEther } from 'viem';

export default async ({deployments}) => {
  const {deploy} = deployments;
  const publicClient = await hre.viem.getPublicClient();
  const walletClients = await hre.viem.getWalletClients();
  const erc20Deploy = await deploy("ERC20Mock", {
    from: walletClients[0].account.address,
    args: [],
    log: true
  })

  const erc20 = await getContract({
    abi: erc20Deploy.abi,
    address: erc20Deploy.address,
    client: {wallet: walletClients[0]}
  })
  

  let i = 0
  while ( i < 20) {
    const hash = await erc20.write.mint([walletClients[i].account.address, parseEther('100')]);
    console.log('hash', hash)
    await publicClient.waitForTransactionReceipt({ hash });
    i++
  }


}
