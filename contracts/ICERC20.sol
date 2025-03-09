// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@fhenixprotocol/contracts/access/Permissioned.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@fhenixprotocol/contracts/FHE.sol";

interface ICERC20 is IERC20 {
  function encryptedAllowance(
    Permission calldata perm,
    address spender
  ) external view returns (uint256);

  function encryptedBalanceOf(
    Permission calldata perm
  ) external view returns (uint256);

  function getPermitSealed(
    Permission memory permission
  ) external view returns (string memory);

  function wrap(uint256 amount) external;

  function unwrap(inEuint64 memory amount) external;

  function approveEncrypted(
    address spender,
    inEuint64 calldata encryptedAmount
  ) external;

  function approveEncrypted(address spender, euint64 amount) external;

  function transferEncrypted(
    address to,
    inEuint64 calldata encryptedAmount
  ) external;

  function transferEncrypted(address to, euint64 amount) external;

  function transferFromEncrypted(
    address from,
    address to,
    inEuint64 calldata encryptedAmount
  ) external;

  function transferFromEncrypted(
    address from,
    address to,
    euint64 amount
  ) external;
}
