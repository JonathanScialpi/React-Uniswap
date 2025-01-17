// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DEFToken is ERC20 {
    constructor(uint initialSupply) ERC20("DEF Token", "DEF"){
        _mint(msg.sender, initialSupply);
    }
}