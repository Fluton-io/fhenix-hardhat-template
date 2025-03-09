import { task } from "hardhat/config";

task("transferFrom", "Get user balance")
  .addParam("signeraddress", "signer address")
  .addParam("tokenaddress", "cERC20 contract address")
  .addParam("to", "receiver address")
  .addOptionalParam("from", "sender address")
  .addOptionalParam("amount", "transfer amount", "1000000") // 1 cERC20
  .setAction(async function (
    { signeraddress, tokenaddress, from, to, amount },
    hre,
  ) {
    const { ethers, fhenixjs } = hre;
    const user = await ethers.getSigner(signeraddress);

    if (!from) {
      from = user.address;
    }

    let contract = await ethers.getContractAt("cUSDC", tokenaddress, user);

    // contract = contract.connect(signer) as unknown as FhenixCERC20;

    console.log("Using address: ", user.address);
    console.log(`Running transferFrom, targeting contract at: ${tokenaddress}`);

    const encryptedAmount = await fhenixjs.encrypt_uint64(BigInt(amount));
    await contract["transferFromEncrypted(address,address,(bytes,int32))"](
      from,
      to,
      encryptedAmount,
    );

    console.log(`Transferred successfully`);
  });
