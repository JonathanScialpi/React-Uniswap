const path = require('path');
require('@nomiclabs/hardhat-ethers');
require("@nomiclabs/hardhat-truffle5");
require('@nomicfoundation/hardhat-toolbox')
require('dotenv').config({path: path.join(__dirname, '../../.env')});
const etherScanService = require('../../services/etherscan-service');

//npx hardhat --network localhost deploy --swaprouter 0xE592427A0AEce92De3Edee1F18E0157C05861564 --poolfee 3000 --signeraddress 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
task("deploy", "Deploys the Custodian Contract")
  .addParam("swaprouter", "Uniswap router address", process.env.UNI_SWAP_ROUTER_ADDRESS)
  .addParam("poolfee", "Uniswap pool fee", 3000, types.int)
  .addParam("signeraddress", "public key of the account which will deploy the contract")
  .setAction(async (taskArgs) => {
    const Custodian = await ethers.getContractFactory("Custodian");
    const custodianContract = await Custodian.deploy(taskArgs.swaprouter, taskArgs.poolfee);
    await custodianContract.deployed();
    console.log("Deployed address: ", custodianContract.address);
    console.log("The owner of the contract is: ", await custodianContract.owner());
  });


//npx hardhat --network localhost allocate --custodianaddress 0x3fdc08D815cc4ED3B7F69Ee246716f2C8bCD6b07 --takenusdc 1000000 --allocationamount 20000 --signeraddress 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --tradingaddress 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
task("allocate", "Funds the Custodian Contract with USDC taken from a whale account")
  .addParam("custodianaddress", "The Address where the Custodian contract is deployed")
  .addParam("takenusdc", "The amount of USDC to take from the whale account")
  .addParam("allocationamount", "The amount of USDC to place into the trader's account")
  .addParam("signeraddress", "public key of the Custodian owner()")
  .addParam("tradingaddress", "public key of the user who wants to swap their tokens")
  .setAction(async (taskArgs) => {
  const addressWithTokens = process.env.WHALE_ADDRESS; //usdc whale account
  const usdcContractAddress = process.env.USDC_CONTRACT_ADDRESS; //usdc address on mainnet
  const usdcProxyAddressForAbi = process.env.USDC_PROXY_ADDRESS; //ABI for the implementation contract
  const wethContractAddress = process.env.WETH_CONTRACT_ADDRESS; // weth address on mainnet
  const wbtcContractAddress = process.env.WBTC_CONTRACT_ADDRESS; // wbtc address on mainnet
  
  await network.provider.send("hardhat_impersonateAccount", [addressWithTokens]);
  const impersonatedSigner = await ethers.getSigner(addressWithTokens);
  const depositorSigner = await ethers.getSigner(taskArgs.tradingaddress)

  // get USDC ABI from Etherscan
  const usdcABI = await etherScanService.getSmartContractAbi(usdcProxyAddressForAbi);
  const wethABI = await etherScanService.getSmartContractAbi(wethContractAddress);
  const wbtcABI = await etherScanService.getSmartContractAbi(wbtcContractAddress);

  // create the USDC token instance
  const usdcContract = await ethers.getContractAt(JSON.parse(usdcABI), usdcContractAddress);
  const wethContract = await ethers.getContractAt(JSON.parse(wethABI), wethContractAddress);
  const wbtcContract = await ethers.getContractAt(JSON.parse(wbtcABI), wbtcContractAddress);

  // whale transfers USDC to Custodian contract
  await usdcContract.connect(impersonatedSigner).transfer(taskArgs.custodianaddress, taskArgs.takenusdc);
  const custodianUSDCBalance = await usdcContract.connect(impersonatedSigner).balanceOf(taskArgs.custodianaddress);
  console.log(`Transferred ${custodianUSDCBalance} USDC to the Custodian contract`);

  // Register USDC token and then update the balance of the Custodian's USDC fund
  const custodianContract = await ethers.getContractAt("Custodian", taskArgs.custodianaddress)
  await custodianContract.registerERC20("USDC", usdcContractAddress, {from: taskArgs.signeraddress});
  await custodianContract.registerERC20("WETH", wethContractAddress, {from: taskArgs.signeraddress});
  await custodianContract.registerERC20("WBTC", wbtcContractAddress, {from: taskArgs.signeraddress});
  await custodianContract.setCustodianBalance('USDC', {from: taskArgs.signeraddress});
  console.log("Custodian's USDC balance has been set");

  //allocate USDC to the depositor address
  await custodianContract.allocate(taskArgs.tradingaddress, 'USDC', taskArgs.allocationamount, {from: taskArgs.signeraddress});
  // await usdcContract.connect(depositorSigner).approve(custodianContract.address, taskArgs.allocationamount, {from: taskArgs.tradingaddress});
  // await wethContract.connect(depositorSigner).approve(custodianContract.address, taskArgs.allocationamount, {from: taskArgs.tradingaddress});
  // await wbtcContract.connect(depositorSigner).approve(custodianContract.address, taskArgs.allocationamount, {from: taskArgs.tradingaddress});
  })

module.exports = {
  // defaultNetwork: "goerli",
  networks: {
    hardhat: {
      forking: {
        url : process.env.INFURA_MAINNET_ENDPOINT,
        blockNumber: parseInt(process.env.INFURA_MAINNET_BLOCK_NUMBER)
      },
      initialBaseFeePerGas: 0, // setting this to zero for now: https://github.com/NomicFoundation/hardhat/issues/1216
      allowUnlimitedContractSize: true
    },
    kovan: {
      url : process.env.INFURA_KOVAN_ENDPOINT,
      blockNumber:  parseInt(process.env.INFURA_KOVAN_BLOCK_NUMBER)
    },
    goerli: {
      url : process.env.INFURA_GOERLI_ENDPOINT,
      blockNumber: parseInt(process.env.INFURA_GOERLI_BLOCK_NUMBER)
    }
  },
  solidity: "0.8.9",
};
