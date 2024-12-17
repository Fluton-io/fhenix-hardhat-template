import { FhenixWEERC20 } from "../typechain-types";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { Deployment } from "hardhat-deploy/dist/types";

task("task:approveEncrypted")
  .addParam(
    "spender",
    "Address to approve. Default is bridge contract.",
    undefined,
    undefined,
    true,
  )
  .addParam("amount", "Amount to approve. Default is MaxUint32", "4294967295")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { fhenixjs, ethers, deployments } = hre;
    let { spender, amount } = taskArguments;
    const [signer] = await ethers.getSigners();

    const FhenixWEERC20: Deployment = await deployments.get("FhenixWEERC20");

    if (!spender) {
      spender = FhenixWEERC20.address;
    }

    let contract = await ethers.getContractAt(
      "FhenixWEERC20",
      FhenixWEERC20.address,
    );
    contract = contract.connect(signer) as unknown as FhenixWEERC20;

    console.log(
      `Running approve(${amount}), targeting contract at: ${FhenixWEERC20.address}`,
    );

    const encryptedAmount = await fhenixjs.encrypt_uint32(+amount);

    try {
      await contract.approveEncrypted(spender, encryptedAmount);
    } catch (e) {
      console.log(`Failed to send add transaction: ${e}`);
      return;
    }
  });
