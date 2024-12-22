import { FhenixClient, getPermit, Permit } from "fhenixjs";
import hre from "hardhat";
import { createInstance as createFhevmClient } from "fhevmjs";
import { abi as fhenixContractABI } from "../utils/ABI/FhenixContractABI";
import { abi as zamaContractABI } from "../utils/ABI/FhenixContractABI";
import { writeFile } from "fs/promises";

const fhenixBridgeContractAddress =
  "0xEE848FDad9dE793451D93D0E2028E1BFbf0759a3";
const zamaBridgeContractAddress = "0xD794f10F660319fDDA742145A40673a128EAbbcA";

const { fhenixjs, ethers } = hre;

const fhenixProvider = ethers.provider;
const zamaProvider = new ethers.JsonRpcProvider("https://devnet.zama.ai");

const zamaWallet = new ethers.Wallet(
  process.env.RELAYER_PRIVATE_KEY!,
  zamaProvider,
);
const fhenixWallet = new ethers.Wallet(
  process.env.RELAYER_PRIVATE_KEY!,
  fhenixProvider,
);

const fhenixClient = new FhenixClient({ provider: fhenixProvider });

const fhenixBridgeContract = new ethers.Contract(
  fhenixBridgeContractAddress,
  fhenixContractABI,
  fhenixProvider,
);
const zamaBridgeContract = new ethers.Contract(
  zamaBridgeContractAddress,
  zamaContractABI,
  zamaWallet,
);

let permit: Permit | null; // fhenix permit
let zamaClient: any; // zama fhevm client

async function main() {
  // set fhenix permit
  permit = await getPermit(fhenixBridgeContractAddress, fhenixProvider);
  if (!permit) {
    throw new Error("Permit not found");
  }
  fhenixClient.storePermit(permit, fhenixWallet.address);
  console.log("Permit", permit);
  await writeFile("./relayer/permit.json", JSON.stringify(permit, null, 2));

  // set zama fhevm instance
  zamaClient = await createFhevmClient({
    networkUrl: "https://devnet.zama.ai",
    gatewayUrl: "https://gateway.devnet.zama.ai",
  });
  console.log("Instance", zamaClient);

  /*   const { publicKey, privateKey: reEncryptPrivateKey } =
    zamaClient.generateKeypair();

  const eip712 = zamaClient.createEIP712(publicKey, zamaBridgeContractAddress);

  const signature = await zamaWallet.signMessage(JSON.stringify(eip712)); */

  console.log("Running the relayer as address", fhenixWallet.address);

  // listen for packet events
  fhenixBridgeContract.on("Packet", async (log1, log2, log3, log4, log5) => {
    console.log("Packet Events", log1, log2, log3, log4, log5);

    const clearTo = `0x${fhenixClient
      .unseal(fhenixBridgeContractAddress, log3, fhenixWallet.address)
      .toString(16)}`;
    const clearAmount = fhenixClient.unseal(
      fhenixBridgeContractAddress,
      log4,
      fhenixWallet.address,
    );

    console.log("Clear To", clearTo);
    console.log("Clear Amount", clearAmount);

    const einput = zamaClient.createEncryptedInput(
      zamaBridgeContractAddress,
      fhenixWallet.address,
    );
    const einputs = einput.add64(clearAmount).encrypt();

    console.log("encrypted inputs, calling onRecvIntent on Zama");

    const onRecvIntentResult = await zamaBridgeContract.onRecvIntent(
      clearTo,
      einputs.handles[0],
      einputs.inputProof,
    );

    console.log("onRecvIntent called on Zama: ", onRecvIntentResult);
  });

  /*   zamaBridgeContract.on("IntentProcessed", (log1, log2, log3) => {
    console.log("Intent Processed", log1, log2, log3);
  });

  zamaBridgeContract.on("TestPacket", (log1) => {
    console.log("TestPacket works", log1);
  });

  zamaBridgeContract.on("Packet", async (log1, log2, log3) => {
    console.log("Packet", log1, log2, log3);

    console.log("is log1", log1);
    console.log("is reEncryptPrivateKey", reEncryptPrivateKey);
    console.log("is publicKey", publicKey);
    console.log("is signature", signature);
    console.log("is zamaBridgeContractAddress", zamaBridgeContractAddress);
    console.log("is zamaWallet.address", zamaWallet.address);
    const userDecryptedTo = await zamaClient.reencrypt(
      log1,
      reEncryptPrivateKey,
      publicKey,
      signature,
      zamaBridgeContractAddress,
      zamaWallet.address,
    );

    console.log("is log2", log2);
    console.log("is reEncryptPrivateKey", reEncryptPrivateKey);
    console.log("is publicKey", publicKey);
    console.log("is signature", signature);
    console.log("is zamaBridgeContractAddress", zamaBridgeContractAddress);
    console.log("is zamaWallet.address", zamaWallet.address);

    const userDecryptedAmount = await zamaClient.reencrypt(
      log2,
      reEncryptPrivateKey,
      publicKey,
      signature,
      zamaBridgeContractAddress,
      zamaWallet.address,
    );

    const hexAddress = "0x" + userDecryptedTo.toString(16).padStart(40, "0");
    const readableAmount = userDecryptedAmount.toString();

    console.log("to is", hexAddress);
    console.log("amount is", readableAmount);
  }); */
}

main();
