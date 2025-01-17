import { useState, useEffect } from "react";
import './css/transfer.css'
import Button from '@mui/material/Button';

function Transfer(props) {
    
    const [amountOut, setAmountOut] = useState(0) 
    const [conversionMap, setConversionMap] = useState({
        amountIn : 0,
        currencyIn : "USDC",
        currencyOut : "WETH"
    })

    const conversion = () => {
        if(conversionMap.currencyIn === "USDC" & conversionMap.currencyOut === "WETH"){
            setAmountOut(conversionMap.amountIn * props.usdcToWeth)
        }else if(conversionMap.currencyIn === "USDC" & conversionMap.currencyOut === "WBTC"){
            setAmountOut(conversionMap.amountIn * props.usdcToWbtc)
        }else if(conversionMap.currencyIn === "WETH" & conversionMap.currencyOut === "USDC"){
            setAmountOut(conversionMap.amountIn * props.wethToUsdc)
        }else if(conversionMap.currencyIn === "WETH" & conversionMap.currencyOut === "WBTC"){
            setAmountOut(conversionMap.amountIn * props.wethToWbtc)
        }else if(conversionMap.currencyIn === "WBTC" & conversionMap.currencyOut === "USDC"){
            setAmountOut(conversionMap.amountIn * props.wbtcToUsdc)
        }else if(conversionMap.currencyIn === "WBTC" & conversionMap.currencyOut === "WETH"){
            setAmountOut(conversionMap.amountIn * props.wbtcToWeth)
        }else if(conversionMap.currencyIn === "WETH" & conversionMap.currencyOut === "WETH"){
            setAmountOut(conversionMap.amountIn)
        }else if(conversionMap.currencyIn === "WBTC" & conversionMap.currencyOut === "WBTC"){
            setAmountOut(conversionMap.amountIn)
        }else if(conversionMap.currencyIn === "USDC" & conversionMap.currencyOut === "USDC"){
            setAmountOut(conversionMap.amountIn)
        }
    }

    const swapping = () =>{
        props.swap(conversionMap.amountIn, conversionMap.currencyIn, conversionMap.currencyOut)
    }

    const updateStates = async(key, value) => {
        setConversionMap({...conversionMap, [key] : value})
    }

    useEffect(() => {
        conversion()
    },[conversionMap.amountIn, conversionMap.currencyIn, conversionMap.currencyOut])
 
    return (
        <div>
            <h3>Transfers</h3>
            <div className="flex">
                <div>
                    <label>From</label>
                    <select
                        value={conversionMap.currencyIn}
                        onChange={(e) => updateStates("currencyIn", e.target.value)}>
                        {props.btcBalance && <option value='WBTC'>BTC</option>}
                        {props.ethBalance && <option value='WETH'>ETH</option>}
                        {props.usdcBalance && <option value='USDC'>USDC</option>}
                    </select>
                </div>

                <div className="to">
                    <label>To</label>
                    <select
                        value={conversionMap.currencyOut}
                        onChange={(e) => updateStates("currencyOut", e.target.value)}>
                        <option value='WBTC'>BTC</option>
                        <option value='WETH'>ETH</option>
                        <option value='USDC'>USDC</option>
                    </select>
                </div>    
            </div>

            <div className="amount">
            <form>
                <label>
                Amount:
                </label>
                <input 
                type="text" 
                value={conversionMap.amountIn}
                onChange={(e) => updateStates("amountIn", Number(e.target.value))}/>
                </form>
                <p>
                {conversionMap.amountIn.toLocaleString('en-US')} {conversionMap.currencyIn.replace("WETH", "ETH").replace("WBTC", "BTC")} will convert to {!amountOut ? 0 : (Math.round(amountOut*100)/100).toLocaleString('en-US')} {conversionMap.currencyOut.replace("WETH", "ETH").replace("WBTC", "BTC")}
                </p>
                <p>
                    Press submit to complete transaction
                </p>
            </div>

            <Button variant="contained" onClick={swapping}>Submit</Button>

        </div>
    );
  }
  
  export default Transfer;