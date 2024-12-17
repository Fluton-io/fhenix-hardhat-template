import { WrappingERC20 } from "../typechain-types";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { Deployment } from "hardhat-deploy/dist/types";

task("task:transferEncrypted")
  .addParam("to", "Address to transfer tokens")
  .addParam("amount", "Amount to transfer.")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { fhenixjs, ethers, deployments } = hre;
    let { to, amount } = taskArguments;
    const [signer] = await ethers.getSigners();

    const FhenixWEERC20: Deployment = await deployments.get("WrappingERC20");

    let contract = await ethers.getContractAt(
      "WrappingERC20",
      FhenixWEERC20.address,
    );
    contract = contract.connect(signer) as unknown as WrappingERC20;

    console.log(
      `Running transferEncrypted(${to}, ${amount}), targeting contract at: ${FhenixWEERC20.address}`,
    );

    const encryptedAmount = await fhenixjs.encrypt_uint32(+amount);

    try {
      await contract.transferEncrypted(to, encryptedAmount);
    } catch (e) {
      console.log(`Failed to send add transaction: ${e}`);
      return;
    }
  });
