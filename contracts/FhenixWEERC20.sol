// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@fhenixprotocol/contracts/access/Permissioned.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@fhenixprotocol/contracts/FHE.sol";

contract cUSDC is ERC20, Permissioned {
  uint8 public constant encDecimals = 6;

  mapping(address => euint32) internal _encBalances;
  mapping(address => mapping(address => euint32)) internal _allowances;

  constructor(string memory name, string memory symbol) ERC20(name, symbol) {
    _mint(msg.sender, 1000000 * 10 ** uint(decimals()));
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
    euint32 shieldedAmount = FHE.asEuint32(convertedAmount);

    _encBalances[msg.sender] = _encBalances[msg.sender] + shieldedAmount;
  }

  function unwrap(inEuint32 memory amount) external {
    euint32 _amount = FHE.asEuint32(amount);
    FHE.req(_encBalances[msg.sender].gte(_amount));

    _encBalances[msg.sender] = _encBalances[msg.sender] - _amount;

    uint64 decryptedAmount = FHE.decrypt(_amount);
    uint256 convertedAmount = _convertDecimalForUnwrap(decryptedAmount);

    _mint(msg.sender, convertedAmount);
  }

  function approveEncrypted(
    address spender,
    inEuint32 calldata encryptedAmount
  ) external {
    euint32 amount = FHE.asEuint32(encryptedAmount);

    _allowances[msg.sender][spender] = amount;
  }

  function transferEncrypted(
    address to,
    inEuint32 calldata encryptedAmount
  ) external {
    euint32 amount = FHE.asEuint32(encryptedAmount);
    FHE.req(amount.lte(_encBalances[msg.sender]));

    _transferEncrypted(msg.sender, to, amount);
  }

  function transferFromEncrypted(
    address from,
    address to,
    inEuint32 calldata encryptedAmount
  ) external {
    euint32 amount = FHE.asEuint32(encryptedAmount);
    ebool canTransfer = FHE.and(
      amount.lte(_encBalances[from]),
      amount.lte(_allowances[from][msg.sender])
    );
    euint32 transferAmount = FHE.select(canTransfer, amount, FHE.asEuint32(0));

    _transferEncrypted(from, to, transferAmount);
  }

  function _transferEncrypted(
    address from,
    address to,
    euint32 amount
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
