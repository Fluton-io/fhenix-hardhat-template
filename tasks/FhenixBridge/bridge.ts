import { task } from "hardhat/config";
import { Deployment } from "hardhat-deploy/dist/types";
import { readFile } from "fs/promises";

task("bridge")
  .addParam("tokenaddress", "cERC20 contract address")
  .addOptionalParam("receiver", "receiver address")
  .addOptionalParam("amount", "amount to bridge", "1000000") // 1 cERC20
  .addOptionalParam("relayerAddress", "Relayer address")
  .addOptionalParam("relayerSeal", "Relayer seal")
  .setAction(async function (
    { tokenaddress, receiver, amount, relayerAddress, relayerSeal },
    hre,
  ) {
    const { ethers, deployments, fhenixjs } = hre;
    const [_, user, relayer] = await ethers.getSigners();

    if (!relayerAddress) {
      relayerAddress = relayer.address;
    }

    if (!receiver) {
      receiver = user.address;
    }

    if (!relayerSeal) {
      const permitString = await readFile("./relayer/permit.json", "utf-8");
      const permit = JSON.parse(permitString);
      relayerSeal = permit.publicKey;
    }

    const FhenixBridge: Deployment = await deployments.get("FHEBridge");
    let contract = await ethers.getContractAt(
      "FHEBridge",
      FhenixBridge.address,
      user,
    );

    console.log(
      `Running bridge(${tokenaddress}, ${receiver}, ${amount}, ${relayerAddress}, ${relayerSeal}), targeting contract at: ${FhenixBridge.address}`,
    );

    const encryptedTo = await fhenixjs.encrypt_address(receiver);
    const encryptedAmount = await fhenixjs.encrypt_uint64(amount);
    await contract.bridgeCERC20(
      tokenaddress,
      encryptedTo,
      encryptedAmount,
      relayerAddress,
      relayerSeal,
    );
  });
