async function main () {

  const custodianAddress = '0x3fdc08D815cc4ED3B7F69Ee246716f2C8bCD6b07';
  const CustodianSigner = await ethers.getContractFactory('Custodian');
  const custodianContract = await CustodianSigner.attach(custodianAddress);

  const poolFee = await custodianContract.poolFee();
  console.log("poolFee: ", poolFee.toString());
  
  await ethers.provider.getBlockNumber().then((result) => {
    console.log("Current block number: " + result);
  });
}
  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });