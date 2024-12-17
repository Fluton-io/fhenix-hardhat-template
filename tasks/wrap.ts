import { FhenixWEERC20 } from "../typechain-types";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { Deployment } from "hardhat-deploy/dist/types";

task("task:wrap")
  .addParam("amount", "Amount to wrap", "1000000000000000000")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const { amount } = taskArguments;
    const [signer] = await ethers.getSigners();

    const FhenixWEERC20: Deployment = await deployments.get("FhenixWEERC20");
    let contract = await ethers.getContractAt(
      "FhenixWEERC20",
      FhenixWEERC20.address,
    );
    contract = contract.connect(signer) as unknown as FhenixWEERC20;

    console.log(
      `Running wrap(${amount}), targeting contract at: ${FhenixWEERC20.address}`,
    );

    try {
      await contract.wrap(amount);
    } catch (e) {
      console.log(`Failed to send add transaction: ${e}`);
      return;
    }
  });
