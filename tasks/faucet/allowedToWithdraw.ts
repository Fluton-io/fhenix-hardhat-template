import { task } from "hardhat/config";

import { Faucet } from "../../types";

task(
  "allowedToWithdraw",
  "Check if the wallet can request tokens from the Faucet",
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
    const txHash = await faucet.allowedToWithdraw(signeraddress);

    const ts = (await ethers.provider.getBlock("latest"))?.timestamp;
    console.log("Current timestamp: ", ts);

    console.info("allowedToWithdraw result: ", txHash);
  });
