import { FhenixBridge, FhenixWEERC20 } from "../typechain-types";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { Deployment } from "hardhat-deploy/dist/types";
import { readFile } from "fs/promises";

task("task:bridge")
  .addParam("to", "Address to send to")
  .addParam("amount", "Amount to wrap", "1000000000000000000")
  .addParam("relayerAddress", "Relayer address", undefined, undefined, true)
  .addParam("relayerSeal", "Relayer seal", undefined, undefined, true)
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhenixjs } = hre;
    let { to, amount, relayerAddress, relayerSeal } = taskArguments;

    if (!relayerAddress) {
      if (!process.env.RELAYER_PRIVATE_KEY) {
        throw new Error(
          "Please provide relayerAddress or set RELAYER_PRIVATE_KEY in the environment variables, then run a relayer.",
        );
      }
      relayerAddress = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY)
        .address;
    }

    if (!relayerSeal) {
      if (!process.env.RELAYER_PRIVATE_KEY) {
        throw new Error(
          "Please provide relayerSeal or set RELAYER_PRIVATE_KEY in the environment variables, then run a relayer.",
        );
      }
      const permitString = await readFile("./relayer/permit.json", "utf-8");
      const permit = JSON.parse(permitString);
      relayerSeal = permit.publicKey;
    }
    const [signer] = await ethers.getSigners();

    const FhenixBridge: Deployment = await deployments.get("FhenixBridge");
    let contract = await ethers.getContractAt(
      "FhenixBridge",
      FhenixBridge.address,
    );
    contract = contract.connect(signer) as unknown as FhenixBridge;

    console.log(
      `Running bridge(${to}, ${amount}, ${relayerAddress}, ${relayerSeal}), targeting contract at: ${FhenixBridge.address}`,
    );

    try {
      const encryptedTo = await fhenixjs.encrypt_address(to);
      const encryptedAmount = await fhenixjs.encrypt_uint32(amount);
      await contract.bridgeWEERC20(
        encryptedTo,
        encryptedAmount,
        relayerAddress,
        relayerSeal,
      );
    } catch (e) {
      console.log(`Failed to send add transaction: ${e}`);
      return;
    }
  });
