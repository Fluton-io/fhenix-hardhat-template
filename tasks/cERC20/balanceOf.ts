import { task } from "hardhat/config";

task("balanceOf", "Get user balance")
  .addParam("signeraddress", "signer address")
  .addParam("tokenaddress", "cERC20 contract address")
  .addOptionalParam("address", "User Address")
  .setAction(async function ({ signeraddress, tokenaddress, address }, hre) {
    const { ethers, deployments, fhenixjs } = hre;
    const signer = await ethers.getSigner(signeraddress);

    if (!address) {
      address = signer.address;
    }

    let contract = await ethers.getContractAt("cUSDC", tokenaddress, signer);

    console.log(`Running balanceOf, targeting contract at: ${tokenaddress}`);

    const balanceOfResult = await contract.balanceOf(address);

    console.log(`erc20 balance: ${balanceOfResult.toString()}`);

    console.log(
      `Running encryptedBalanceOf, targeting contract at: ${tokenaddress}`,
    );

    let permit = await fhenixjs.generatePermit(
      tokenaddress,
      undefined, // use the internal provider
      signer,
    );

    console.log(`permit: ${JSON.stringify(permit)}`);

    const permission = fhenixjs.extractPermitPermission(permit);

    const encryptedResult = await contract.encryptedBalanceOf(permission);
    console.log(`got balance: ${encryptedResult.toString()}`);

    const sealedResult = await contract.getPermitSealed(permit);
    let unsealed = fhenixjs.unseal(tokenaddress, sealedResult, signer.address);

    console.log(`got unsealed result: ${unsealed.toString()}`);
  });
