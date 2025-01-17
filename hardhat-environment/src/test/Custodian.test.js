const { expect } = require('chai');
const { BN, expectEvent } = require('@openzeppelin/test-helpers');
const Custodian = artifacts.require('Custodian');
const ABCToken = artifacts.require('ABCToken');
const etherScanService = require("../../../services/etherscan-service");

contract('Custodian', ([ owner, depositorABC, newOwner, robber ]) => {

  // --------------------------------------------- Start onlyOwner Tests ---------------------------------------------
  beforeEach(async ()=> {
    const SwapRouter = await ethers.getContractAt("ISwapRouter", "0xE592427A0AEce92De3Edee1F18E0157C05861564");
    this.custodian = await Custodian.new(SwapRouter.address, 3000, { from: owner });
    this.abcToken = await ABCToken.new(100000, { from: depositorABC }); // instantiate ERC20 ABC contract
    await this.abcToken.approve(this.custodian.address, 100, {from: depositorABC}); // allow custodian address to transfer 100 ABC tokens from depositor ABC
  });

  it('owner is assigned', async ()=> {
    const creator = await this.custodian.owner();
    expect(creator).to.equal(owner);
  });

  it('transfer ownership', async ()=> {

    // take note of the deployer of the contract
    const origOwner = await this.custodian.owner();

    //transfer ownership
    await this.custodian.transferOwnership(newOwner, { from: owner });

    //get the new owner to compare
    const lastestOwner = await this.custodian.owner();
    expect(origOwner).to.not.equal(lastestOwner); //owners are not the same
    expect(newOwner).to.equal(lastestOwner); // new owner is the current owner
  });

  // --------------------------------------------- End onlyOwner Tests ---------------------------------------------

  // --------------------------------------------- Start Register Tests ---------------------------------------------
  it('register token', async() => {
    const abcTokenIsRegistered = await this.custodian.registerERC20(
      "ABC",
      this.abcToken.address,
      {from: owner}
    );

    expectEvent(await abcTokenIsRegistered, 'RegisteredERC20', {ticker: "ABC", tokenAddress: this.abcToken.address });
  });
  // --------------------------------------------- End Register Tests ---------------------------------------------

  // --------------------------------------------- Start Deposit Tests ---------------------------------------------
  it('register, deposit, check balance - ERC20', async() => {
    await this.custodian.registerERC20(
      "ABC",
      this.abcToken.address,
      {from: owner}
    );
    const amount = new BN('10');
    const depositReceipt = await this.custodian.depositERC20(
      amount,
     "ABC",
      {from: depositorABC}
    );

    expectEvent(await depositReceipt, 'Deposit', {ticker: "ABC", tokenAddress: this.abcToken.address, sender: depositorABC, amount: amount });
    
    expect(await this.custodian.tickers(0)).to.be.equal("ABC");
    expect(await this.custodian.userBalanceMap(depositorABC, "ABC")).to.be.equal("10");
  });

  it('deposit, check balance - ETH', async() => {
    
    const amount = new BN('2');
    const depositReceipt = await this.custodian.depositETH({from: depositorABC, value: amount});
      
    expectEvent(await depositReceipt, 'Deposit', {ticker: "ETH", tokenAddress: "0x0", sender: depositorABC, amount: amount,});
    
    expect(await this.custodian.userBalanceMap(depositorABC, "ETH")).to.be.equal("2");
  });
  // --------------------------------------------- End Deposit Tests ---------------------------------------------

  // --------------------------------------------- Start Withdrawal Tests ---------------------------------------------
  it('register, deposit, withdraw - ERC20', async() => {
    await this.custodian.registerERC20(
      "ABC",
      this.abcToken.address,
      {from: owner}
    );
    const depositAmount = new BN('10');
    await this.custodian.depositERC20(
      depositAmount,
     "ABC",
      {from: depositorABC}
    );

    const withdrawAmount = new BN('5');
    const withdrawReceipt = await this.custodian.withdraw("ABC", withdrawAmount, {from: depositorABC});
    expectEvent(await withdrawReceipt, 'Withdrawal', {ticker: "ABC", sender: depositorABC, amount: withdrawAmount, remainingBalance: withdrawAmount});
    expect(await this.custodian.userBalanceMap(depositorABC, "ABC")).to.be.equal("5");
    expect(await this.abcToken.balanceOf(depositorABC)).to.be.equal("99995");
  });

  it('register, deposit, withdraw - ETH', async() => {
    const depositAmount = ethers.utils.parseEther("5.0");
    await this.custodian.depositETH({from: depositorABC, value: depositAmount});

    const withdrawAmount = ethers.utils.parseEther("2.0");
    const remainingBalance = ethers.utils.parseEther("3.0");
    const withdrawReceipt = await this.custodian.withdraw("ETH", withdrawAmount, {from: depositorABC});
    expectEvent(await withdrawReceipt, 'Withdrawal', {ticker: "ETH", sender: depositorABC, amount: withdrawAmount.toString(), remainingBalance: remainingBalance.toString()});
    expect(await this.custodian.userBalanceMap(depositorABC, "ETH")).to.be.equal(remainingBalance.toString());
    expect(parseInt(ethers.utils.formatEther(await ethers.provider.getBalance(depositorABC)))).to.lessThan(parseInt('9997'));
  });
  // --------------------------------------------- End Withdrawal Tests ---------------------------------------------
  
  // --------------------------------------------- Start Swap Tests ---------------------------------------------
  it('Update PoolFee', async() => {
    const newPoolFee = new BN('2000');
    const poolFeeUpdateReceiptawait = await this.custodian.setPoolFee(newPoolFee, {from: owner});
    expectEvent(await poolFeeUpdateReceiptawait, 'PoolFeeUpdated', {poolFee: newPoolFee, sender: owner});
  });

  it('SwapExactInputSingle - USDC for WETH', async() => {

    // impersonate account; replace with an address that actually has your token
    const addressWithTokens = "0x8894E0a0c962CB723c1976a4421c95949bE2D4E3"; //usdc whale account
    const usdcContractAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; //usdc address on mainnet
    const usdcProxyAddressForAbi = "0xa2327a938febf5fec13bacfb16ae10ecbc4cbdcf"; //ABI for the implementation contract
    const wethContractAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // weth address on mainnet
    await network.provider.send("hardhat_impersonateAccount", [addressWithTokens]);
    const impersonatedSigner = await ethers.getSigner(addressWithTokens);
    const depositorSigner = await ethers.getSigner(depositorABC);
    
    // get USDC ABI from Etherscan
    const usdcABI = await etherScanService.getSmartContractAbi(usdcProxyAddressForAbi);
    // create the USDC token instance
    const usdcContract = await ethers.getContractAt(JSON.parse(usdcABI), usdcContractAddress);

    // connect it to the impersonated signer and send it to your signer
    expect(await usdcContract.connect(impersonatedSigner).balanceOf(depositorABC)).to.equal("1000000"); // get USDC balance of depositor
    expect(await usdcContract.connect(impersonatedSigner).symbol()).to.equal("USDC"); // proof that we are interacting with the USDC contract

    // register USDC and WETH, then approve allowance on USDC with the Custodian contract
    await this.custodian.registerERC20( "USDC", usdcContractAddress, {from: owner} );
    await this.custodian.registerERC20( "WETH", wethContractAddress, {from: owner} );
    await usdcContract.connect(depositorSigner).approve(this.custodian.address, 1000, {from: depositorABC});

    // deposit 1000 USDC to custodian
    const depositAmount = new BN('1000');
    const depositReceipt = await this.custodian.depositERC20(depositAmount, "USDC", {from: depositorABC} );
    expectEvent(await depositReceipt, 'Deposit', {ticker: "USDC", tokenAddress: usdcContractAddress, sender: depositorABC, amount: depositAmount });
    expect(await this.custodian.tickers(0)).to.be.equal("USDC");
    expect(await this.custodian.userBalanceMap(depositorABC, "USDC")).to.be.equal("1000");
    
    // withdraw some USDC from their Custodial account
    const withdrawAmount = new BN('5');
    await this.custodian.withdraw("USDC", withdrawAmount, {from: depositorABC});
    expect(await this.custodian.userBalanceMap(depositorABC, "USDC")).to.be.equal('995');
    
    // swap 100 USDC for WETH
    const swapAmount = new BN('100');
    const swapReceipt = await this.custodian.swapExactInputSingle(swapAmount, "USDC", "WETH", {from: depositorABC}); 
    
    expect(await this.custodian.userBalanceMap(depositorABC, "USDC")).to.be.equal('895');
    const wethUserBalance = await this.custodian.userBalanceMap(depositorABC, "WETH");
    expect(parseFloat(ethers.utils.formatEther(wethUserBalance.toNumber()))).to.lessThan(1)

    expectEvent(await swapReceipt, 'ExactInputSingle', {
      tokenTickerIn: "USDC",
      amountIn: swapAmount, 
      tokenTickerOut: "WETH",
      amountOut: wethUserBalance,
      poolFee: new BN('3000'),
      sender: depositorABC
    });
    
  });

  it('Fund Allocation; Swap USDC to WBTC; Swap WBTC to USDC', async() => {

    // impersonate account; replace with an address that actually has your token
    const addressWithTokens = "0x8894E0a0c962CB723c1976a4421c95949bE2D4E3"; //usdc whale account
    const usdcContractAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; //usdc address on mainnet
    const wbtcContractAddress = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
    const wethContractAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const usdcProxyAddressForAbi = "0xa2327a938febf5fec13bacfb16ae10ecbc4cbdcf"; //ABI for the implementation contract
    await network.provider.send("hardhat_impersonateAccount", [addressWithTokens]);
    const impersonatedSigner = await ethers.getSigner(addressWithTokens);
    
    // get USDC ABI from Etherscan
    const usdcABI = await etherScanService.getSmartContractAbi(usdcProxyAddressForAbi);

    // create the USDC token instance
    const usdcContract = await ethers.getContractAt(JSON.parse(usdcABI), usdcContractAddress);

    // whale transfers USDC to Custodian contract
    await usdcContract.connect(impersonatedSigner).transfer(this.custodian.address, 1000000);
    expect(await usdcContract.connect(impersonatedSigner).balanceOf(this.custodian.address)).to.equal("1000000");

    // Register USDC token and then update the balance of the Custodian's USDC fund
    await this.custodian.registerERC20("USDC", usdcContractAddress, {from: owner});
    await this.custodian.registerERC20("WETH", wethContractAddress, {from: owner});
    // await this.custodian.registerERC20("WBTC", wbtcContractAddress, {from: owner});

    const setCustodianBalance = await this.custodian.setCustodianBalance('USDC', {from: owner});
    expectEvent(await setCustodianBalance, 'CustodianBalanceUpdate', {ticker: "USDC", tokenAddress: usdcContractAddress, balance: new BN('1000000'), custodianAddress: this.custodian.address });

    // Allocate some USDC to the depositorABC user
    const allocationReceipt = await this.custodian.allocate(depositorABC, 'USDC', 50000, {from: owner});
    expectEvent(await allocationReceipt, 'Allocation', {ticker: 'USDC', amount: new BN('50000'), user: depositorABC, userBalance: new BN('50000'), custodianBalance: new BN('950000')});

     // swap 10000 USDC for WETH
     const swapAmount = new BN('50000');
     await this.custodian.swapExactInputSingle(swapAmount, "USDC", "WETH", {from: depositorABC}); 

     const swapAmount2 = 2 * (10 ** (18 - 6))  //convert to WETH amount by multiplying by 12 decimals places
     const swapReceipt2 = await this.custodian.swapExactInputSingle(swapAmount2, "WETH", "USDC", {from: depositorABC}); 
     const usdcUserBalance = await this.custodian.userBalanceMap(depositorABC, "USDC");
     
     expectEvent(await swapReceipt2, 'ExactInputSingle', {
      tokenTickerIn: "WETH",
      amountIn: new BN(swapAmount2.toString()), 
      tokenTickerOut: "USDC",
      amountOut: usdcUserBalance,
      poolFee: new BN('3000'),
      sender: depositorABC
    });
  });
  // --------------------------------------------- End Swap Tests ---------------------------------------------
  
  // --------------------------------------------- Start Chainlink Integration Tests ---------------------------------------------
  it('Check ETH/USD Price - Chainlink Oracle', async() => {
    const oracleResponse = await this.custodian.getLatestPrice('0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419');
    expect(oracleResponse[0].toNumber() / (10**oracleResponse[1])).to.be.equal(1619.2502461);
  });
  // --------------------------------------------- End Chainlink Integration Tests ---------------------------------------------

// text fixture to impersonate a transfer from a large USDC holder to the Custodian Account
// contract('SampleTest', ([ owner, depositorABC, newOwner, robber ]) => {
//   beforeEach(async ()=> {
//     const SwapRouter = await ethers.getContractAt("ISwapRouter", "0xE592427A0AEce92De3Edee1F18E0157C05861564");
//     this.custodian = await Custodian.new(SwapRouter.address, 3000, { from: owner });
     
//     // impersonate account; replace with an address that actually has your token
//      const addressWithTokens = "0x8894E0a0c962CB723c1976a4421c95949bE2D4E3"; //usdc whale account
//      const usdcContractAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; //usdc address on mainnet
 
//      await network.provider.send("hardhat_impersonateAccount", [addressWithTokens]);
//      const impersonatedSigner = await ethers.getSigner(addressWithTokens);
     
//      // create the USDC token instance
//      const usdcContract = await ethers.getContractAt(usdcAbiFile.usdcAbiCode, usdcContractAddress);
 
//      // whale transfers USDC to Custodian contract
//      await usdcContract.connect(impersonatedSigner).transfer(this.custodian.address, 1000000);
 
//      // Register USDC token and then update the balance of the Custodian's USDC fund
//      await this.custodian.registerERC20("USDC", usdcContractAddress, {from: owner});
//      await this.custodian.setCustodianBalance('USDC', {from: owner});
 
//      // Allocate some USDC to the depositorABC user
//      await this.custodian.allocate(depositorABC, 'USDC', 20000, {from: owner});
//    });

//    /**
//     * The above will be executed before your other test cases. 
//     * Write your test cases below.
//     */
});