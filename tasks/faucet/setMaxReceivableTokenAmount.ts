import { task } from "hardhat/config";

import { Faucet } from "../../types";

task(
  "setMaxReceivableTokenAmount",
  "Sets the maximum receivable amount for specified token for Faucet",
)
  .addParam("signeraddress", "signer address")
  .addParam("tokenaddress", "token address")
  .addParam("amount", "amount in wei")
  .setAction(async ({ signeraddress, tokenaddress, amount }, hre) => {
    const { ethers, deployments } = hre;
    const signer = await ethers.getSigner(signeraddress);
    const faucetDeployment = await deployments.get("Faucet");

    const faucet = (await ethers.getContractAt(
      "Faucet",
      faucetDeployment.address,
      signer,
    )) as unknown as Faucet;

    console.log("Setting...");
    const txHash = await faucet.setMaxReceivableTokenAmount(
      tokenaddress,
      amount,
    );

    console.info("setMaxReceivableTokenAmount tx receipt: ", txHash);
  });
