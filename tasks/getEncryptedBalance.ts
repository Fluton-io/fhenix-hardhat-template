import { task } from "hardhat/config";
import { Deployment } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { FhenixWEERC20 } from "../typechain-types";

task("task:getEncryptedBalance").setAction(async function (
  _taskArguments: TaskArguments,
  hre: HardhatRuntimeEnvironment,
) {
  const { fhenixjs, ethers, deployments } = hre;
  const [signer] = await ethers.getSigners();
  console.log(signer.address);

  const FhenixWEERC20: Deployment = await deployments.get("FhenixWEERC20");

  let contract = await ethers.getContractAt(
    "FhenixWEERC20",
    FhenixWEERC20.address,
  );

  contract = contract.connect(signer) as unknown as FhenixWEERC20;

  console.log(
    `Running encryptedBalanceOf, targeting contract at: ${FhenixWEERC20.address}`,
  );

  let permit = await fhenixjs.generatePermit(
    FhenixWEERC20.address,
    undefined, // use the internal provider
    signer,
  );

  console.log(`permit: ${JSON.stringify(permit)}`);

  const permission = fhenixjs.extractPermitPermission(permit);

  const result = await contract.encryptedBalanceOf(permission);
  console.log(`got balance: ${result.toString()}`);

  const sealedResult = await contract.getCounterPermitSealed(permit);
  let unsealed = fhenixjs.unseal(
    FhenixWEERC20.address,
    sealedResult,
    signer.address,
  );

  console.log(`got unsealed result: ${unsealed.toString()}`);
});
