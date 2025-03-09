import { task } from "hardhat/config";

task("allowance", "Get user allowance")
  .addParam("signeraddress", "signer address")
  .addParam("tokenaddress", "cERC20 contract address")
  .addParam("spenderaddress", "Spender Address")
  .addOptionalParam("address", "User Address")
  .setAction(async function (
    { signeraddress, tokenaddress, address, spenderaddress },
    hre,
  ) {
    const { ethers, fhenixjs } = hre;
    const signer = await ethers.getSigner(signeraddress);

    if (!address) {
      address = signer.address;
    }

    let contract = await ethers.getContractAt("cUSDC", tokenaddress, signer);

    console.log(
      `Running encryptedAllowance, targeting contract at: ${tokenaddress}`,
    );

    let permit = await fhenixjs.generatePermit(
      tokenaddress,
      undefined, // use the internal provider
      signer,
    );

    console.log(`permit: ${JSON.stringify(permit)}`);

    const permission = fhenixjs.extractPermitPermission(permit);

    const encryptedResult = await contract.encryptedAllowance(
      permission,
      spenderaddress,
    );
    console.log(`got result: ${encryptedResult.toString()}`);
  });
