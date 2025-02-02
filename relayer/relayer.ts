import { FhenixClient, getPermit, Permit } from "fhenixjs";
import hre from "hardhat";
import { createInstance as createFhevmClient } from "fhevmjs";
import { abi as fhenixContractABI } from "../utils/ABI/FhenixContractABI";
import { abi as zamaContractABI } from "../utils/ABI/ZamaContractABI";
import { writeFile } from "fs/promises";
import addresses from "../config/addresses";
import { GATEWAY_URL } from "../config/constants";
import tokenMapping from "../config/tokenMapping";

const fhenixBridgeContractAddress =
  "0x2a1a79Ae4e6Af8a37566fAf91Fd818B1574d61D7";
const zamaBridgeContractAddress = "0x8f8AFfC05CFE28D76038AcDbb624DBd3d89116EE";

const { fhenixjs, ethers } = hre;

const fhenixProvider = ethers.provider;

const sepoliaProvider = new ethers.JsonRpcProvider(
  "https://eth-sepolia-public.unifra.io",
);

const sepoliaWallet = new ethers.Wallet(
  process.env.RELAYER_PRIVATE_KEY!,
  sepoliaProvider,
);

const fhenixWallet = new ethers.Wallet(
  process.env.RELAYER_PRIVATE_KEY!,
  fhenixProvider,
);

const fhenixClient = new FhenixClient({ provider: fhenixProvider });

const fhenixBridgeContract = new ethers.Contract(
  fhenixBridgeContractAddress,
  fhenixContractABI,
  fhenixWallet,
);

const zamaBridgeContract = new ethers.Contract(
  zamaBridgeContractAddress,
  zamaContractABI,
  sepoliaWallet,
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
    kmsContractAddress: addresses[11155111].KMSVERIFIER,
    aclContractAddress: addresses[11155111].ACL,
    networkUrl: "https://eth-sepolia.public.blastapi.io",
    gatewayUrl: GATEWAY_URL,
  });

  /*   const { publicKey, privateKey: reEncryptPrivateKey } =
    zamaClient.generateKeypair();

  const eip712 = zamaClient.createEIP712(publicKey, zamaBridgeContractAddress);

  const signature = await zamaWallet.signMessage(JSON.stringify(eip712)); */

  console.log("Running the relayer as address", fhenixWallet.address);

  // listen for packet events
  fhenixBridgeContract.on(
    "Packet",
    async (log1, log2, log3, log4, log5, log6) => {
      console.log("Packet Events", log1, log2, log3, log4, log5, log6);

      const clearTo = `0x${fhenixClient
        .unseal(fhenixBridgeContractAddress, log4, fhenixWallet.address)
        .toString(16)}`;
      const clearAmount = fhenixClient.unseal(
        fhenixBridgeContractAddress,
        log5,
        fhenixWallet.address,
      );

      console.log("Clear To", clearTo);
      console.log("Clear Amount", clearAmount);

      const einput = zamaClient.createEncryptedInput(
        zamaBridgeContractAddress,
        fhenixWallet.address,
      );
      const einputs = await einput.add64(clearAmount).encrypt();

      console.log("encrypted inputs, calling onRecvIntent on Zama");

      const tokenAddressOnSepolia = tokenMapping[log1];
      console.log("Token Address on Sepolia", tokenAddressOnSepolia);

      const onRecvIntentResult = await zamaBridgeContract.onRecvIntent(
        tokenAddressOnSepolia,
        clearTo,
        einputs.handles[0],
        einputs.inputProof,
      );

      console.log("onRecvIntent called on Zama: ", onRecvIntentResult);
    },
  );

  /*   zamaBridgeContract.on("IntentProcessed", (log1, log2, log3) => {
    console.log("Intent Processed", log1, log2, log3);
  });

  zamaBridgeContract.on("TestPacket", (log1) => {
    console.log("TestPacket works", log1);
  });  */

  zamaBridgeContract.on("Packet", async (log1, log2, log3, log4) => {
    console.log("Packet", log1, log2, log3, log4);

    const { publicKey, privateKey } = zamaClient.generateKeypair();
    const eip712 = zamaClient.createEIP712(
      publicKey,
      zamaBridgeContractAddress,
    );
    const signature = await sepoliaWallet.signTypedData(
      eip712.domain,
      { Reencrypt: eip712.types.Reencrypt },
      eip712.message,
    );

    const userDecryptedTo = await zamaClient.reencrypt(
      log2,
      privateKey,
      publicKey,
      signature,
      zamaBridgeContractAddress,
      sepoliaWallet.address,
    );

    console.log("userDecryptedTo", userDecryptedTo);

    const userDecryptedAmount = await zamaClient.reencrypt(
      log3,
      privateKey,
      publicKey,
      signature,
      zamaBridgeContractAddress,
      sepoliaWallet.address,
    );

    console.log("userDecryptedAmount", userDecryptedAmount);

    const hexAddress = "0x" + userDecryptedTo.toString(16).padStart(40, "0");
    const readableAmount = userDecryptedAmount.toString();

    console.log("to is", hexAddress);
    console.log("amount is", readableAmount);

    const encryptedAmount = await fhenixjs.encrypt_uint32(+readableAmount);
    const tokenAddressOnFhenix = tokenMapping[log1];
    console.log("Token Address on Fhenix", tokenAddressOnFhenix);
    const onRecvIntentResult = await fhenixBridgeContract.onRecvIntent(
      tokenAddressOnFhenix,
      hexAddress,
      encryptedAmount,
    );

    console.log("onRecvIntent called on Fhenix: ", onRecvIntentResult);
  });
}

main();
