import { task } from "hardhat/config";
import { Deployment } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";

task("task:getBalance").setAction(async function (
  _taskArguments: TaskArguments,
  hre: HardhatRuntimeEnvironment,
) {
  const { ethers, deployments } = hre;
  const [signer] = await ethers.getSigners();

  const FhenixWEERC20: Deployment = await deployments.get("FhenixWEERC20");

  let contract = await ethers.getContractAt(
    "FhenixWEERC20",
    FhenixWEERC20.address,
  );

  // contract = contract.connect(signer) as unknown as FhenixWEERC20;

  console.log(
    `Running balance, targeting contract at: ${FhenixWEERC20.address}`,
  );

  const result = await contract.balanceOf(signer.address);

  console.log(`got balance: ${result.toString()}`);
});
