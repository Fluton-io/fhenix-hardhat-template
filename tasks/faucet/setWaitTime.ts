import { task } from "hardhat/config";

import { Faucet } from "../../types";

task("setWaitTime", "Sets the wait time for Faucet")
  .addParam("signeraddress", "signer address")
  .addParam("waittime", "wait time in seconds")
  .setAction(async ({ signeraddress, waittime }, hre) => {
    const { ethers, deployments } = hre;
    const signer = await ethers.getSigner(signeraddress);
    const faucetDeployment = await deployments.get("Faucet");

    const faucet = (await ethers.getContractAt(
      "Faucet",
      faucetDeployment.address,
      signer,
    )) as unknown as Faucet;

    console.log("Setting...");
    const txHash = await faucet.setWaitTime(waittime);

    console.info("setWaitTime tx receipt: ", txHash);
  });
