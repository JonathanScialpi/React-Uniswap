import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';


function Balances(props) {


  function createData(currency, units, exchangeRate, value){
    return {currency, units, exchangeRate, value}
  }

  const rows = [
  createData('USDC', (props.usdcBalance).toLocaleString('en-US'), 1, '$' + (props.usdcBalance).toLocaleString('en-US')),
  createData('BTC', (Math.ceil(props.btcBalance*100)/100).toLocaleString('en-US'), (Math.ceil(props.wbtcToUsdc*100)/100).toLocaleString('en-US'), '$' + (Math.ceil((props.btcBalance * props.wbtcToUsdc)*100)/100).toLocaleString('en-US')),
  createData('ETH', (Math.ceil(props.ethBalance*100)/100).toLocaleString('en-US'), (Math.ceil(props.wethToUsdc*100)/100).toLocaleString('en-US'), '$' + (Math.ceil((props.ethBalance * props.wethToUsdc)*100)/100).toLocaleString('en-US')),
  createData('Total','','', '$' + (Math.ceil((props.usdcBalance + (props.ethBalance * props.wethToUsdc) + (props.btcBalance * props.wbtcToUsdc))*100)/100).toLocaleString('en-US'))
]

    return (
      <div>
      <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Asset</TableCell>
            <TableCell align="right">Units</TableCell>
            <TableCell align="right">Exchange Rate</TableCell>
            <TableCell align="right">Value (USDC)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.currency}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {row.currency}
              </TableCell>
              <TableCell align="right">{row.units}</TableCell>
              <TableCell align="right">{row.exchangeRate}</TableCell>
              <TableCell align="right">{row.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    </div>
    

      /*
      <div className="App">
        <h3>Balances</h3>
        <div>
        <div>
            USDC: {props.usdcBalance}
        </div>
        <br></br>
        <div>
            BTC: {props.btcBalance}
        </div>
        <br></br>
        <div>
            ETH: {props.ethBalance}
        </div>
        </div>
        
        
      </div>
      */
    );
  }
  
  export default Balances;