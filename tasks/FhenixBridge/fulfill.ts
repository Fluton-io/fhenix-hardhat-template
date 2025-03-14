import { task } from "hardhat/config";
import { Deployment } from "hardhat-deploy/dist/types";
import { readFile } from "fs/promises";

task("fulfill", "Fulfills an intent on the bridge")
    .addParam("tokenaddress", "The input token address")
    .addOptionalParam("bridge", "The address of the FHEBridge contract")
    .addOptionalParam("sender", "The address of the sender")
    .addOptionalParam("receiver", "The address of the receiver")
    .addOptionalParam("relayeraddress", "The address of the relayer")
    .addOptionalParam("amount", "The amount of input tokens", "1000000")
    .setAction(
        async (
            { tokenaddress, sender, bridge, receiver, relayeraddress, amount },
            hre,
        ) => {
            const { ethers, deployments, getChainId, fhenixjs } = hre;
            const [deployer, user, relayer] = await ethers.getSigners();
            const chainId = await getChainId();

            if (!sender) {
                sender = user.address;
            }

            if (!receiver) {
                receiver = user.address;
            }

            if (!relayeraddress) {
                relayeraddress = relayer.address;
            }

            const destinationChainId = 3;
            const intentId = 11011176;

            // if (!relayerSeal) {
            //     const permitString = await readFile(
            //         "./relayer/permit.json",
            //         "utf-8",
            //     );
            //     const permit = JSON.parse(permitString);
            //     relayerSeal = permit.publicKey;
            // }

            const FhenixBridge: Deployment = await deployments.get("FHEBridge");
            let contract = await ethers.getContractAt(
                "FHEBridge",
                FhenixBridge.address,
                user,
            );

            const encryptedOutputAmount = await fhenixjs.encrypt_uint64(
                BigInt(amount),
            );

            const intent = {
                sender: relayeraddress,
                receiver: relayeraddress,
                relayer: receiver,
                inputToken: tokenaddress,
                outputToken: tokenaddress,
                inputAmount: BigInt(
                    "100833511206055277357287699976534657812992192028410152269058949700512661430712",
                ),
                outputAmount: BigInt(
                    "100833511206055277357287699976534657812992192028410152269058949700512661430712",
                ),
                id: intentId,
                originChainId: chainId,
                destinationChainId: destinationChainId,
                filledStatus: 0,
            };

            console.log(
                `Running fulfill with intent: ${intent}, targeting contract at: ${FhenixBridge.address}`,
            );

            console.log("USER: ", user.address);

            // const tx = await contract.fulfill(intent);
            const tx = await contract[
                "fulfill((address,address,address,address,address,uint256,uint256,uint256,uint32,uint32,uint8),(bytes,int32))"
            ](intent, encryptedOutputAmount);

            console.log("Fulfill successful! ", tx);
        },
    );
