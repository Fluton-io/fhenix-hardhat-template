// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@fhenixprotocol/contracts/access/Permissioned.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@fhenixprotocol/contracts/FHE.sol";
import {ICERC20} from "./ICERC20.sol";

contract cUSDC is ICERC20, ERC20, Permissioned {
  uint8 public constant encDecimals = 6;

  mapping(address => euint64) internal _encBalances;
  mapping(address => mapping(address => euint64)) internal _allowances;

  constructor(string memory name, string memory symbol) ERC20(name, symbol) {
    _mint(msg.sender, 1000000 * 10 ** uint(decimals()));
  }

  function encryptedAllowance(
    Permission calldata perm,
    address spender
  ) external view onlySender(perm) returns (uint256) {
    return FHE.decrypt(_allowances[msg.sender][spender]);
  }

  function encryptedBalanceOf(
    Permission calldata perm
  ) external view onlySender(perm) returns (uint256) {
    return FHE.decrypt(_encBalances[msg.sender]);
  }

  function getPermitSealed(
    Permission memory permission
  ) public view onlySender(permission) returns (string memory) {
    return FHE.sealoutput(_encBalances[msg.sender], permission.publicKey);
  }

  function wrap(uint256 amount) external {
    require(balanceOf(msg.sender) >= amount);

    _burn(msg.sender, amount);

    uint64 convertedAmount = _convertDecimalForWrap(amount);
    euint64 shieldedAmount = FHE.asEuint64(convertedAmount);

    _encBalances[msg.sender] = _encBalances[msg.sender] + shieldedAmount;
  }

  function unwrap(inEuint64 memory amount) external {
    euint64 _amount = FHE.asEuint64(amount);
    FHE.req(_encBalances[msg.sender].gte(_amount));

    _encBalances[msg.sender] = _encBalances[msg.sender] - _amount;

    uint64 decryptedAmount = FHE.decrypt(_amount);
    uint256 convertedAmount = _convertDecimalForUnwrap(decryptedAmount);

    _mint(msg.sender, convertedAmount);
  }

  function approveEncrypted(
    address spender,
    inEuint64 calldata encryptedAmount
  ) public {
    euint64 amount = FHE.asEuint64(encryptedAmount);
    approveEncrypted(spender, amount);
  }

  function approveEncrypted(address spender, euint64 amount) public {
    _approve(msg.sender, spender, amount);
  }

  function transferEncrypted(
    address to,
    inEuint64 calldata encryptedAmount
  ) external {
    euint64 amount = FHE.asEuint64(encryptedAmount);
    transferEncrypted(to, amount);
  }

  function transferEncrypted(address to, euint64 amount) public {
    FHE.req(amount.lte(_encBalances[msg.sender]));

    _transferEncrypted(msg.sender, to, amount);
  }

  function transferFromEncrypted(
    address from,
    address to,
    inEuint64 calldata encryptedAmount
  ) external {
    euint64 amount = FHE.asEuint64(encryptedAmount);
    transferFromEncrypted(from, to, amount);
  }

  function transferFromEncrypted(
    address from,
    address to,
    euint64 amount
  ) public {
    ebool canTransfer = FHE.and(
      amount.lte(_encBalances[from]),
      amount.lte(_allowances[from][msg.sender])
    );
    euint64 transferAmount = FHE.select(canTransfer, amount, FHE.asEuint64(0));

    _transferEncrypted(from, to, transferAmount);
  }

  function _approve(
    address owner,
    address spender,
    euint64 amount
  ) internal virtual {
    if (owner == address(0)) {
      revert ERC20InvalidApprover(owner);
    }

    if (spender == address(0)) {
      revert ERC20InvalidSpender(spender);
    }

    _allowances[owner][spender] = amount;
  }

  function _transferEncrypted(
    address from,
    address to,
    euint64 amount
  ) internal {
    _encBalances[to] = _encBalances[to] + amount;

    _encBalances[from] = _encBalances[from] - amount;
  }

  function _convertDecimalForWrap(
    uint256 amount
  ) internal view returns (uint64) {
    return uint64(amount / 10 ** (decimals() - encDecimals));
  }

  function _convertDecimalForUnwrap(
    uint64 amount
  ) internal view returns (uint256) {
    return uint256(amount) * 10 ** (decimals() - encDecimals);
  }
}
