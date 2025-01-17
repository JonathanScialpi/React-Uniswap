import Table from '@mui/material/Table';
import { useEffect, useState } from "react";
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';


function TxHistory() {

  const getTime = (timeStamp) =>{
          const timeStampDate = new Date(timeStamp);
          let day = timeStampDate.getUTCDate();
          let month = timeStampDate.getUTCMonth() + 1;
          let year = timeStampDate.getUTCFullYear();
          let hours = timeStampDate.getUTCHours();
          let minutes = timeStampDate.getUTCMinutes();
          let m = month.toString()
          let d2 = day.toString()
          let y = year.toString()
          let h = hours.toString()
          let min = minutes.toString()
          
          if (d2.length == 1) {
            d2 = '0' + d2
          }
          if (m.length == 1) {
            m = '0' + m
          }
  
          const today = y + '-' + m + '-' + d2 + ' ' + h + ':' + min;
          return today
    
}

const sortByLatest = (mapToSort) => {
  let copyArray = Object.keys(mapToSort);
  copyArray.sort((a, b) => {
    return mapToSort[b].timeStamp - mapToSort[a].timeStamp;
  });
  return copyArray
}

    return (
      <div>
        <h2>Transaction History</h2>
      <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell align="left">Tx Hash</TableCell>
            <TableCell align="left">Token In</TableCell>
            <TableCell align="left">Amount In</TableCell>
            <TableCell align="left">Token Out</TableCell>
            <TableCell align="left">Amount Out</TableCell>
            <TableCell align="left">Pool Fee</TableCell>
            <TableCell align="left">Sender</TableCell>
            <TableCell align="left">Timestamp</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {
          sortByLatest(localStorage).map((key) => {
              const dataMap = JSON.parse(localStorage[key])
              return(
                <TableRow
                key={key}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell align="left"><a href="https://etherscan.io/" target="_blank">{key.substring(0, 4) + "..." + key.substring(key.length-4, key.length)}</a></TableCell>
                <TableCell align="left">{dataMap.tokenTickerIn.replace("WETH", "ETH").replace("WBTC", "BTC")}</TableCell>
                <TableCell align="left">{dataMap.amountIn}</TableCell>
                <TableCell align="left">{dataMap.tokenTickerOut.replace("WETH", "ETH").replace("WBTC", "BTC")}</TableCell>
                <TableCell align="left">{dataMap.amountOut}</TableCell>
                <TableCell align="left">{dataMap.poolFee}</TableCell>
                <TableCell align="left">{dataMap.sender.substring(0, 4) + "..." + dataMap.sender.substring(dataMap.sender.length-4, dataMap.sender.length)}</TableCell>
                <TableCell align="left">{getTime(dataMap.timeStamp)}</TableCell>
              </TableRow>
              )
            })
          }
        </TableBody>
        
      </Table>
    
    </TableContainer>
    </div>
    );
  }
  
  export default TxHistory;