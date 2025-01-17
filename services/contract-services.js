const path = require('path');
const fs = require("fs");
const ethers = require('ethers');
require('dotenv').config({path: path.join(__dirname, '../.env')});
// const etherScanService = require("./etherscan-service");

const connect = (_provider) => {
    let localNetworkProvider;
    localNetworkProvider = new ethers.providers.JsonRpcProvider(_provider);  
    return localNetworkProvider
}

const getUsdcToWeth = async(custodianContract, signer) => {
    // get usdc to weth rate
    const usdcWethOracle = await custodianContract.connect(signer).getLatestPrice(process.env.USDC_WETH_ORACLE).then((result) => {
        return Number(result[0]) / (10 ** result[1])
    });
    return usdcWethOracle;
}

const getUsdcToWbtc = async(custodianContract, signer) => {
    //get usdc to wbtc rate
    const usdcWbtcOracle = await custodianContract.connect(signer).getLatestPrice(process.env.USDC_WBTC_ORACLE).then((result) => {
        return Number(result[0]) / (10 ** result[1])
      });
    return usdcWbtcOracle;
}

const getWbtcToWeth = async(custodianContract, signer) => {
    // get btc to weth
    const wbtcWethOracle = await custodianContract.connect(signer).getLatestPrice(process.env.WBTC_WETH_ORACLE).then((result) => {
      return Number(result[0]) / (10 ** result[1])
    });
    return wbtcWethOracle;
}

const swapExactInputSingle = async(_localNetworkProvider, _contract_name, _contract_address, _trading_address, _amount_in, _token_ticker_in, _token_ticker_out) => {
    const contractPath = path.resolve(__dirname, `../hardhat-environment/src/artifacts/contracts/${_contract_name}.sol/${_contract_name}.json`);    
    const abi = JSON.parse(fs.readFileSync(contractPath)).abi;
    const signer = await _localNetworkProvider.getSigner(_trading_address);
    const custodianContract = new ethers.Contract(_contract_address, abi, _localNetworkProvider);
    await custodianContract.connect(signer).swapExactInputSingle(_amount_in, _token_ticker_in, _token_ticker_out);
    const tokenInUserBalance = (await custodianContract.userBalanceMap(_trading_address, _token_ticker_in)).toNumber();
    let tokenOutUserBalance = (await custodianContract.userBalanceMap(_trading_address, _token_ticker_out)).toNumber();
    let conversionRateString = "";
    const lowerCaseTokenTickerIn = _token_ticker_in.toLowerCase();
    const lowerCaseTokenTickerOut = _token_ticker_out.toLowerCase();
    if(lowerCaseTokenTickerIn.includes("usdc") && lowerCaseTokenTickerOut.includes("weth")){
        tokenOutUserBalance = tokenOutUserBalance / (10 ** (18 - 6))
        const conversionRate = await getUsdcToWeth(custodianContract, signer);
        conversionRateString = `Swapped at a conversion rate of ${conversionRate} USDC : 1 wETH`;
    }else if(lowerCaseTokenTickerIn.includes("usdc") && lowerCaseTokenTickerOut.includes("wbtc")){
        tokenOutUserBalance = tokenOutUserBalance / (10 ** (18 - 16))
        const conversionRate = await getUsdcToWbtc(custodianContract, signer);
        conversionRateString = `Swapped at a conversion rate of ${conversionRate} USDC : 1 wBTC`;
    }else{
        const conversionRate = await getWbtcToWeth(custodianContract,signer);
        conversionRateString = `Swapped at a conversion rate of ${conversionRate} wBTC : 1 wETH`;
    }
    return {
        tokenInUserBalance,
        tokenOutUserBalance,
        conversionRateString
    };
}

const getUserBalanceForCurrency = async(_localNetworkProvider, _contract_name, _contract_address, _user_address, _currency) => {
    const contractPath = path.resolve(__dirname, `../hardhat-environment/src/artifacts/contracts/${_contract_name}.sol/${_contract_name}.json`);
    const abi = JSON.parse(fs.readFileSync(contractPath)).abi;
    const custodianContract = new ethers.Contract(_contract_address, abi, _localNetworkProvider);
    let userBalance =  (await custodianContract.userBalanceMap(_user_address, _currency)).toNumber();
    if (_currency.toLowerCase().includes("weth")) {
        userBalance = userBalance / (10 ** (18 - 6));
    } else if (_currency.toLowerCase().includes("wbtc")) {
        userBalance = userBalance / (10 ** (18 - 16));
    }
    return userBalance;
}

module.exports = { connect, swapExactInputSingle, getUserBalanceForCurrency };