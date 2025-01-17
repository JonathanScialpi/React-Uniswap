# Welcome to the Custodian Dapp CLI

## How to run the React APP

0. Ensure you have a `.env` file set with the proper variables (root directory):
```
#Infura
INFURA_MAINNET_ENDPOINT=https://mainnet.infura.io/v3/{YOUR_API_KEY}
INFURA_MAINNET_BLOCK_NUMBER=15528427

INFURA_KOVAN_ENDPOINT=https://kovan.infura.io/v3/{YOUR_API_KEY}
INFURA_KOVAN_BLOCK_NUMBER=15528427

INFURA_GOERLI_ENDPOINT=https://goerli.infura.io/v3/{YOUR_API_KEY}
INFURA_GOERLI_BLOCK_NUMBER=15528427

#Etherscan
ETHERSCAN_API_KEY={YOUR_API_KEY}

#ETH Contracts on Mainnet
UNI_SWAP_ROUTER_ADDRESS=0xE592427A0AEce92De3Edee1F18E0157C05861564
WHALE_ADDRESS=0x8894E0a0c962CB723c1976a4421c95949bE2D4E3
USDC_CONTRACT_ADDRESS=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
USDC_PROXY_ADDRESS=0xa2327a938febf5fec13bacfb16ae10ecbc4cbdcf
WETH_CONTRACT_ADDRESS=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
WBTC_CONTRACT_ADDRESS=0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599

USDC_WETH_ORACLE=0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
USDC_WBTC_ORACLE=0xf4030086522a5beea4988f8ca5b36dbc97bee88c
WBTC_WETH_ORACLE=0xdeb288f737066589598e9214e782fa5a8ed689e8
```

Ensure you have a `.env` file set with the proper variables in react app root (react-app/):
```
#REACT App vars
REACT_APP_CUSTODIAN_CONTRACT_ADDRESS={YOUR_CUSTODIAN_CONTRACT_ADDRESS}
REACT_APP_TRADER_ADDRESS={YOUR_TRADER_ACCOUNT_ADDRESS}
REACT_APP_USDC_WETH_ORACLE=0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
REACT_APP_USDC_WBTC_ORACLE=0xf4030086522a5beea4988f8ca5b36dbc97bee88c
REACT_APP_WBTC_WETH_ORACLE=0xdeb288f737066589598e9214e782fa5a8ed689e8
REACT_APP_JSON_RPC=http://127.0.0.1:8545/
```
1. Start the Hardhat Network by running `npx harhdat node` from the `/hardhat-environment/src` directory
2. Take note of an ETH key you would like to use for the deployment TX
3. In another terminal, navigate to the `/hardhat-environment/src` directory and execute this command to deploy your contract: `npx hardhat --network localhost deploy --swaprouter 0xE592427A0AEce92De3Edee1F18E0157C05861564 --poolfee 3000 --signeraddress {The_Account_Chosen_In_Step_2}`  
Your output should read: `Custodian has been deployed to address: 0x...some address..`
4. Allocate funds to the trader's account: `npx hardhat --network localhost allocate --custodianaddress {The_Address_Returned_In_Step_3} --takenusdc 1000000 --allocationamount 20000 --signeraddress {The_Account_Chosen_In_Step_2} --tradingaddress {Some_Other_Account}`
5. Update your `.env` file's `REACT_APP_CUSTODIAN_CONTRACT_ADDRESS` and `REACT_APP_TRADER_ADDRESS` to reflect those chosen in the earlier steps.
6. Run the react app: ` cd ../../react-app && npm start`