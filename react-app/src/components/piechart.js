import { PieChart, Pie, Tooltip } from "recharts";


function Piechart(props) {
    let myData = [];
    if(props.ethBalance * props.wethToUsdc){
        myData.push({ name: "ETH", value: Math.ceil((props.ethBalance * props.wethToUsdc)*100)/100, fill:"purple" })
    }
    if(props.btcBalance * props.wbtcToUsdc){
        myData.push({ name: "BTC", value: Math.ceil((props.btcBalance * props.wbtcToUsdc)*100)/100, fill:"orange" })
    }
    if(props.usdcBalance){
        myData.push({ name: "USDC", value: props.usdcBalance , fill:"green" })
    }    

    return (
        <div>
            <h3>Summary (Converted to USDC)</h3>
            <PieChart width={400} height={230}>
                <Pie
                    dataKey="value"
                    isAnimationActive={true}
                    data={myData}
                    outerRadius={80}
                    fill="orangered"
                    label={(data) => data.name + ' $' + data.value.toLocaleString('en-US')}
                />

                {/* Display the tooltips */}
                <Tooltip formatter={(value) => '$' + value.toLocaleString('en-US')} />
            </PieChart>
        </div>
    );
  }
  
  export default Piechart;