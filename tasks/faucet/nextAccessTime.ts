import { task } from "hardhat/config";

import { Faucet } from "../../types";

task(
  "nextAccessTime",
  "Check when the wallet can request tokens from the Faucet",
)
  .addParam("signeraddress", "signer address")
  .setAction(async ({ signeraddress }, hre) => {
    const { ethers, deployments } = hre;
    const signer = await ethers.getSigner(signeraddress);
    const faucetDeployment = await deployments.get("Faucet");

    const faucet = (await ethers.getContractAt(
      "Faucet",
      faucetDeployment.address,
      signer,
    )) as unknown as Faucet;

    console.log("Requesting...");
    const txHash = await faucet.nextAccessTime(signeraddress);

    console.info("nextAccessTime result: ", txHash);
  });
