# How To Run A Forked Network With HardHat

## Step 1 - Create Your Node Project
1. `mkdir myproject && cd myproject`
2. `npm init -y`
3. `npx truffle init`
4. `npm i --save-dev hardhat`
5. `npx hardhat` and select "Create an empty harhat.config.js"
6. At this point you can copy any contracts you'd like into your /contracts directory. Check this [OpenZeppelin](https://docs.openzeppelin.com/learn/developing-smart-contracts) link for more examples.

## Step 2 - Create an Infura Key
1. Go to the [Infura Dashboard](https://infura.io/dashboard)
2. Click **Create New Key**
3. Select your network, assign a name, and click **Create**
4. Under *Network Endpoints* select **Mainnet** and change to the network of your choice.
5. Make a note of the *endpoint link* and *API KEY*

## Step 3 - Integrate with Infura
1. In root of your project: `touch .env`
2. Copy the below into your .env file and replace with your values:
```
INFURA_KOVAN_URL=https:/YOUR_NETWORK_CHOICE.infura.io/v3/
INFURA_API_KEY=YOUR_KEY
```
3. Navigate to your *hardhat.config.js* file and replace the contents with:
```
const path = require('path');
require('@nomiclabs/hardhat-ethers');
require("@nomiclabs/hardhat-truffle5");
require('dotenv').config({path: path.join(__dirname, '../.env')});
module.exports = {
  networks: {
    hardhat: {
      forking: {
        url : (process.env.INFURA_KOVAN_URL + process.env.INFURA_API_KEY),
      }
    }
  },
  solidity: "0.8.9",
};
```
**Note: Install any of the dependencies you don't have in those require statements using NPM**


## Step 4 - Interacting Programmatically
1. Create a script file: `touch ./src/scripts/index.js`
2. Replace the contents with:
```
async function main () {
  const address = '0x0b8A26eF66Bb48c918674b01CA9499D145108473' // change with a contract or wallet address 

  await ethers.provider.getBalance(address).then((balance) => {
    // convert a currency unit from wei to ether
    const balanceInEth = ethers.utils.formatEther(balance)
    console.log(`balance: ${balanceInEth} ETH`)
    })
  }
  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
```
3. Execute the script with `npx hardhat run scripts/index.js`  
Your output should read:  **balance: 0.001000001661803953 ETH**