const yargs = require('yargs');
const contractServices = require('./services/contract-services');

yargs.usage("\nUsage: $0 [cmd] <args>").alias("h", "help").version('1.0.0');

let localNetworkProvider;
try{
  localNetworkProvider = contractServices.connect('http://127.0.0.1:8545/');
}catch (e){
    throw("Couldn't connect to a network. Make sure you have ran 'npx hardhat node prior to using this CLI.'");
}

yargs
  .command(
    "swapExactInputSingle",
    "Swap fixed amount for max amount",
    {
      name: {
        type: "string",
        demandOption: true,
        describe: "Contract name",
      },
      contract_address: {
        type: "string",
        demandOption: true,
        describe: "Provide address of the deployed contract"
      },
      trading_address: {
        type: "string",
        demandOption: true,
        describe: "Select an account's public key given by your local running network"
      },
      amount_in: {
        type: "string",
        demandOption: true,
        describe: "Amount in",
      },
      token_ticker_in: {
        type: "string",
        demandOption: true,
        describe: "Token ticker in",
      },
      token_ticker_out: {
        type: "string",
        demandOption: true,
        describe: "Token ticker out",
      }
    },
    async(argv) => {
      const userBalances = await contractServices.swapExactInputSingle(localNetworkProvider, argv.name, argv.contract_address, argv.trading_address, argv.amount_in,
        argv.token_ticker_in, argv.token_ticker_out);
      console.log(`${argv.amount_in} ${argv.token_ticker_in} has been swapped to ${userBalances.tokenOutUserBalance} ${argv.token_ticker_out}`);
      console.log(`${argv.token_ticker_in} balance : ${userBalances.tokenInUserBalance}`);
      console.log(`${argv.token_ticker_out} balance : ${userBalances.tokenOutUserBalance}`);
      console.log(userBalances.conversionRateString);
    }
  )
  .example("node $0 swapExactInputSingle --name Custodian --contract_address 0x3fdc08D815cc4ED3B7F69Ee246716f2C8bCD6b07 --trading_address 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 --amount_in 1000 --token_ticker_in USDC --token_ticker_out WETH")
  .command(
    "getUserBalance",
    "Get balance of a user for given currency",
    {
      name: {
        type: "string",
        demandOption: true,
        describe: "Contract name",
      },
      contract_address: {
        type: "string",
        demandOption: true,
        describe: "Provide address of the deployed contract"
      },
      user_address: {
        type: "string",
        demandOption: true,
        describe: "Select an account's public key given by your local running network"
      },
      currency: {
        type: "string",
        demandOption: true,
        describe: "Currency",
      }
    },
    async(argv) => {
      const userBalance = await contractServices.getUserBalanceForCurrency(localNetworkProvider, argv.name, argv.contract_address, argv.user_address, argv.currency);
      console.log(`User's ${argv.currency} balance : ${userBalance}`);
    }
  )
  .example("node $0 getUserBalance --name Custodian --contract_address 0x3fdc08D815cc4ED3B7F69Ee246716f2C8bCD6b07 --user_address 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 --currency WETH");

yargs.argv;