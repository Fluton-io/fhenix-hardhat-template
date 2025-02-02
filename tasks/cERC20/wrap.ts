import { task } from "hardhat/config";

task("wrap", "Wrap your erc20 into cERC20")
  .addParam("signeraddress", "signer address")
  .addParam("tokenaddress", "cERC20 contract address")
  .addOptionalParam("amount", "wrap amount", "1000000000000000000") // 1 ERC20
  .setAction(async function ({ signeraddress, tokenaddress, amount }, hre) {
    const { ethers } = hre;
    const signer = await ethers.getSigner(signeraddress);

    let contract = await ethers.getContractAt("cUSDC", tokenaddress, signer);

    console.log(
      `Running wrap(${amount}), targeting contract at: ${tokenaddress}`,
    );
    await contract.wrap(amount);

    console.log(`Wrap ${amount} successfully`);
  });
