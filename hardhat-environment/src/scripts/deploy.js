async function main () {
    const SwapRouter = await ethers.getContractAt("ISwapRouter", "0xE592427A0AEce92De3Edee1F18E0157C05861564");
    const Custodian = await ethers.getContractFactory("Custodian");
    const custodian = await Custodian.deploy(SwapRouter.address, 3000);
    await custodian.deployed();
    console.log("address: ", custodian.address)
  }
  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });