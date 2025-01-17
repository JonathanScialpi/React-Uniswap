const getSmartContractAbi = async(_address) => {
    const requestOptions = {
      method: 'GET',
      redirect: 'follow'
    };
    const etherscanResponse = await fetch(`https://api.etherscan.io/api?module=contract&action=getabi&address=${_address}&apikey=${process.env.ETHERSCAN_API_KEY}`, requestOptions)
      .then(res => res.json()).then((data) => {
        return data.result;
    });
    return etherscanResponse;
}

module.exports = { getSmartContractAbi };