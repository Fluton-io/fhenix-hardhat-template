import { task } from "hardhat/config";
import { Deployment } from "hardhat-deploy/dist/types";
import { readFile } from "fs/promises";

task("bridge")
  .addParam("tokenaddress", "cERC20 contract address")
  .addOptionalParam("receiver", "receiver address")
  .addOptionalParam("amount", "amount to bridge", "1000000") // 1 cERC20
  .addOptionalParam("relayeraddress", "Relayer address")
  .addOptionalParam("relayerSeal", "Relayer seal")
  .setAction(async function (
    { tokenaddress, receiver, amount, relayeraddress, relayerSeal },
    hre,
  ) {
    const { ethers, deployments, fhenixjs } = hre;
    const [_, user, relayer] = await ethers.getSigners();

    if (!relayeraddress) {
      relayeraddress = relayer.address;
    }

    if (!receiver) {
      receiver = user.address;
    }

    const destinationChainId = 3;

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
      `Running bridge(${tokenaddress}, ${receiver}, ${amount}, ${relayeraddress}, ${relayerSeal}), targeting contract at: ${FhenixBridge.address}`,
    );

    const encryptedAmount = await fhenixjs.encrypt_uint64(BigInt(amount));

    console.log("USER: ", user.address);
    const tx = await contract.bridge(
      user.address,
      receiver,
      relayeraddress,
      tokenaddress,
      tokenaddress,
      encryptedAmount,
      encryptedAmount,
      destinationChainId,
      relayerSeal,
    );

    console.log("Bridge successful! ", tx);
  });
