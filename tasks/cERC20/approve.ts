import { task } from "hardhat/config";

task("approve", "Approve cERC20 contract to spend USDC")
  .addParam("signeraddress", "signer address")
  .addParam("tokenaddress", "cERC20 contract address")
  .addParam("spenderaddress", "spender address")
  .addParam("amount", "amount to approve")
  .setAction(
    async ({ signeraddress, tokenaddress, spenderaddress, amount }, hre) => {
      const { ethers, fhenixjs } = hre;
      const signer = await ethers.getSigner(signeraddress);

      let contract = await ethers.getContractAt("cUSDC", tokenaddress, signer);

      console.log(
        `Running approve(${spenderaddress}, ${amount}), targeting contract at: ${tokenaddress}`,
      );

      const encryptedAmount = await fhenixjs.encrypt_uint32(+amount);
      await contract.approveEncrypted(spenderaddress, encryptedAmount);

      console.log(`Approved successfully`);
    },
  );
