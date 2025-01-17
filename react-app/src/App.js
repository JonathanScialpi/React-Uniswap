// const path = require('path');
// require('dotenv').config({path: path.join(__dirname, '../.env')});
import Balances from "./components/balances";
import Transfer from "./components/transfer";
import Piechart from "./components/piechart";
import "./components/css/app.css"
import { useEffect, useState } from "react";
import Card from '@mui/material/Card';
import { CardContent } from "@mui/material";
import { ethers } from "ethers";
import custodianAbi from './smartContractAbi/Custodian.json';
import TxHistory from "./components/txHistory";

function App() {
  const [connection, setConnection] = useState()
  const [custodianContract, setCustodianContract] = useState()
  const [usdcBalance, setUSDCBalance] = useState(0)
  const [btcBalance, setBTCBalance] = useState(0)
  const [ethBalance, setETHBalance] = useState(0)
  const [usdcToWeth, setUsdcToWeth] = useState()
  const [usdcToWbtc, setUsdcToWbtc] = useState()
  const [wethToUsdc, setWethToUsdc] = useState()
  const [wethToWbtc, setWethToWbtc] = useState()
  const [wbtcToUsdc, setWbtcToUsdc] = useState()
  const [wbtcToWeth, setWbtcToWeth] = useState()

  const getBalances = async(custodianContract) => {
    await custodianContract.userBalanceMap(process.env.REACT_APP_TRADER_ADDRESS, "USDC").then((result) => {
      setUSDCBalance(parseFloat(result.toString()))
    })

    await custodianContract.userBalanceMap(process.env.REACT_APP_TRADER_ADDRESS, "WETH").then((result) => {
      setETHBalance(result / (10 ** (18 - 6)))
    })

    await custodianContract.userBalanceMap(process.env.REACT_APP_TRADER_ADDRESS, "WBTC").then((result) => {
      setBTCBalance(result / (10 ** (18 - 16)))
    })
  }

  const getConversionRates = async(custodianContract) => {
    
    // get usdc to weth rate
    const usdcWethOracle = await custodianContract.getLatestPrice(process.env.REACT_APP_USDC_WETH_ORACLE).then((result) => {
      return Number(result[0]) / (10 ** result[1])
    })
    setUsdcToWeth(parseFloat(1 / usdcWethOracle))
    setWethToUsdc(usdcWethOracle)

    //get usdc to wbtc rate
    const usdcWbtcOracle = await custodianContract.getLatestPrice(process.env.REACT_APP_USDC_WBTC_ORACLE).then((result) => {
      return Number(result[0]) / (10 ** result[1])
    })

    setUsdcToWbtc(parseFloat(1 / usdcWbtcOracle))
    setWbtcToUsdc(usdcWbtcOracle)

    // get btc to weth
    const wbtcWethOracle = await custodianContract.getLatestPrice(process.env.REACT_APP_WBTC_WETH_ORACLE).then((result) => {
      return Number(result[0]) / (10 ** result[1])
    })

    setWbtcToWeth(wbtcWethOracle)
    setWethToWbtc(usdcWethOracle / usdcWbtcOracle)
  }

  const swap = async(amountIn, currencyIn, currencyOut) => {
    const signer = await connection.getSigner(process.env.REACT_APP_TRADER_ADDRESS)

    let formattedAmountIn = Number(amountIn)
    if(currencyIn === "WETH"){
      formattedAmountIn = amountIn * (10 ** (18 - 6))
    }else if(currencyIn === "WBTC"){
      formattedAmountIn = amountIn * (10 ** (18 - 16))
    }

    const tx = await custodianContract.connect(signer).swapExactInputSingle(formattedAmountIn, currencyIn, currencyOut)
    let receipt = await tx.wait()
    let swapEvent = receipt.events?.filter((x) => {return x.event == "ExactInputSingle"})[0]

    let formattedAmoutOut = Number(swapEvent.args.amountOut)
    if(currencyOut === "WETH"){
      formattedAmoutOut = formattedAmoutOut / (10 ** (18 - 6))
    }else if(currencyOut === "WBTC"){
      formattedAmoutOut = formattedAmoutOut / (10 ** (18 - 16))
    }
   
    localStorage.setItem(swapEvent.transactionHash, JSON.stringify({
      "contractAddress" : swapEvent.address,
      "amountIn" : amountIn, 
      "amountOut" : formattedAmoutOut.toFixed(4),
      "poolFee" : swapEvent.args.poolFee,
      "tokenTickerIn" : swapEvent.args.tokenTickerIn,
      "tokenTickerOut" : swapEvent.args.tokenTickerOut,
      "sender" : swapEvent.args.sender,
      "timeStamp" : new Date()
    }))
    getBalances(custodianContract)
  }

   /*
    On component mount:
    1. set connection to hardhat network
    2. set custodian smart contract instance
    3. set user's USDC balance (should be 20,000 on startup)
    */
  const handleConnection = async(localNetworkProvider)=>{
    setConnection(localNetworkProvider);
    const custodianContract = new ethers.Contract(process.env.REACT_APP_CUSTODIAN_CONTRACT_ADDRESS, custodianAbi.abi, localNetworkProvider)
    setCustodianContract(custodianContract)
    getBalances(custodianContract)
    getConversionRates(custodianContract)
  }

  useEffect(() =>{
    if(!connection){
      const localNetworkProvider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_JSON_RPC);
      handleConnection(localNetworkProvider)
    }
  },[])

  return (
    <div>
      <h1>
        Digital Asset Management
      </h1>
      <div className="intro">
        <div className="components">
          <Card variant="outlined" sx={{ minWidth: 275, minHeight:330 }}>
            <CardContent>
              <Balances className="components" 
                 usdcBalance={usdcBalance} 
                 btcBalance={btcBalance} 
                 ethBalance={ethBalance}
                 usdcToWeth={usdcToWeth}
                 usdcToWbtc={usdcToWbtc}
                 wethToUsdc={wethToUsdc}
                 wethToWbtc={wethToWbtc}
                 wbtcToUsdc={wbtcToUsdc}
                 wbtcToWeth={wbtcToWeth}  
              />
            </CardContent>
          </Card>
          
        </div>
        <div className="components">
          <Card variant="outlined" style={{"width":'500px'}}>
            <CardContent>
              <Piechart 
                className="components" 
                usdcBalance={usdcBalance} 
                btcBalance={btcBalance} 
                ethBalance={ethBalance}
                usdcToWeth={usdcToWeth}
                usdcToWbtc={usdcToWbtc}
                wethToUsdc={wethToUsdc}
                wethToWbtc={wethToWbtc}
                wbtcToUsdc={wbtcToUsdc}
                wbtcToWeth={wbtcToWeth}  
              />
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="intro">
        <div className="components">
            <Card variant="outlined" sx={{ minWidth: 275, minHeight:330 }}>
              <CardContent>
              <Transfer className="components" 
                  usdcBalance={usdcBalance} 
                  btcBalance={btcBalance} 
                  ethBalance={ethBalance} 
                  swap={swap}
                  usdcToWeth={usdcToWeth}
                  usdcToWbtc={usdcToWbtc}
                  wethToUsdc={wethToUsdc}
                  wethToWbtc={wethToWbtc}
                  wbtcToUsdc={wbtcToUsdc}
                  wbtcToWeth={wbtcToWeth}
                />
              </CardContent>
            </Card>
          </div>
          <div className="components">
            <Card variant="outlined" sx={{ minWidth: 275, minHeight:330 }}>
              <CardContent>
              <TxHistory className="components" />
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  );
}

export default App;
