// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/// @title A smart contract capable of manager ERC20's on behalf of a user
/// @author Jonathan.Scialpi@ibm.com
contract Custodian is Ownable {

    // User Balances Management
    mapping(address => mapping(string => uint256)) public userBalanceMap;

    // ERC20 Registry
    mapping(string => address) public tickerToERC20Contract;

    // ERC20 token ticker list
    string[] public tickers;

    // Uniswap Interface Address
    ISwapRouter public immutable swapRouter;

    // Uniswap pool fee
    uint24 public poolFee;

    // emitted events
    event RegisteredERC20(string ticker, address tokenAddress);
    event CustodianBalanceUpdate(string ticker, address tokenAddress, uint256 balance, address custodianAddress);
    event Allocation(string ticker, uint256 amount, address user, uint256 userBalance, uint256 custodianBalance);
    event Deposit(string ticker, address tokenAddress, address sender, uint256 amount);
    event Withdrawal(string ticker, address sender, uint256 amount, uint256 remainingBalance);
    event PoolFeeUpdated(uint24 poolFee, address sender);
    event ExactInputSingle(string tokenTickerIn, uint256 amountIn, string tokenTickerOut, uint256 amountOut, uint24 poolFee, address sender);

    /// @param _swapRouter is the official UniSwapRouter Interface
    /// @param _poolFee is the Uniswap pool fee
    constructor(ISwapRouter _swapRouter, uint24 _poolFee) {
        swapRouter = _swapRouter;
        poolFee = _poolFee;
    }

    /// @notice registers an ERC20 to its mainnet contract address. This will be used to instantiate an ERC20 interface
    /// @param _tokenTicker the symbol of the ERC20
    /// @param _tokenAddress the deployed contract address of the ERC20
    function registerERC20(string memory _tokenTicker, address _tokenAddress) onlyOwner public{
        require(tickerToERC20Contract[_tokenTicker] == address(0x0), "This token has already been registered.");
        tickerToERC20Contract[_tokenTicker] = _tokenAddress;
        tickers.push(_tokenTicker);
        emit RegisteredERC20(_tokenTicker, _tokenAddress);
    }

    /// @notice The contract checks the balance of a given ERC20 in its possesion and stores its value in the userBalanceMap
    /// @param _tokenTicker the symbol of the ERC20
    function setCustodianBalance(string memory _tokenTicker) onlyOwner external{
        require(tickerToERC20Contract[_tokenTicker] != address(0x0), "You must first register this token with registerToken method.");
        IERC20 erc20Address = IERC20(tickerToERC20Contract[_tokenTicker]);
        userBalanceMap[address(this)][_tokenTicker] = erc20Address.balanceOf(address(this));
        emit CustodianBalanceUpdate(_tokenTicker, tickerToERC20Contract[_tokenTicker], userBalanceMap[address(this)][_tokenTicker], address(this));
    }

    /// @notice Instruct the contract to transfer an amount of ERC20 to a user's balance
    /// @param _user the user account which will receive the allocation
    /// @param _tokenTicker the symbol of the ERC20
    /// @param _amount the number of tokens to allocate
    function allocate(address _user, string memory _tokenTicker, uint256 _amount) onlyOwner external{
        require(tickerToERC20Contract[_tokenTicker] != address(0x0), "You must first register this token with registerToken method.");
        IERC20 erc20Address = IERC20(tickerToERC20Contract[_tokenTicker]);
        require(erc20Address.balanceOf(address(this)) >= _amount, "You don't have enough funds to allocate that amount");
        erc20Address.transfer(_user, _amount);
        userBalanceMap[address(this)][_tokenTicker] -= _amount;
        userBalanceMap[_user][_tokenTicker] += _amount;

        emit Allocation(_tokenTicker, _amount, _user, userBalanceMap[_user][_tokenTicker], userBalanceMap[address(this)][_tokenTicker]);
    }

    /// @notice User executed function to deposit an ERC20 into the Custodial contract
    /// @dev the user must APPROVE the custodial contract for the ERC20 before executing this 
    /// @param _amount the number of ERC20 tokens to be transferred into the contract from the user
    /// @param _tokenTicker the symbol of the ERC20 token to be deposited
    function depositERC20(uint256 _amount, string memory _tokenTicker) external{
        require(_amount > 0, "The ERC20 deposit amount must be greater than zero.");
        require(tickerToERC20Contract[_tokenTicker] != address(0x0), "You must first register this token with registerToken method.");
        IERC20 depositERC20Address = IERC20(tickerToERC20Contract[_tokenTicker]);
        depositERC20Address.transferFrom(msg.sender, address(this), _amount);
        userBalanceMap[msg.sender][_tokenTicker] += _amount;
        emit Deposit(_tokenTicker, tickerToERC20Contract[_tokenTicker], msg.sender, _amount);
    }

    /// @notice User executed function to deposit ETH native currency into the Custodial contract
    function depositETH() external payable{
        require(msg.value > 0 ether, "The ETH deposit amount must be greather than zero.");
        userBalanceMap[msg.sender]["ETH"] += msg.value;
        emit Deposit("ETH", address(0x0), msg.sender, msg.value);
    }

    /// @notice User executed function to withdraw some amount of ETH or ERC20
    /// @param _amount the number of ERC20 tokens to be retuned to the user from the contract
    /// @param _tokenTicker the symbol of the ERC20 token to be withdrawn
    function withdraw(string memory _tokenTicker, uint256 _amount) external{
        require(userBalanceMap[msg.sender][_tokenTicker] > 0, "You don't have a balance for this token.");
        require(userBalanceMap[msg.sender][_tokenTicker] >= _amount, "Your balance is less than your withdrawal amount");
        userBalanceMap[msg.sender][_tokenTicker] -= _amount;
        if(keccak256(bytes(_tokenTicker)) == keccak256(bytes("ETH"))){
            payable(msg.sender).transfer(_amount);
        }else{
            IERC20 withdrawERC20Address = IERC20(tickerToERC20Contract[_tokenTicker]);
            withdrawERC20Address.transfer(msg.sender, _amount);
        }
        emit Withdrawal(_tokenTicker, msg.sender, _amount, userBalanceMap[msg.sender][_tokenTicker]);
    }

    /// @notice Custodial function executed to update the Uniswap poolFee for swaps
    /// @param _poolFee the amount to be set for the fee
    function setPoolFee(uint24 _poolFee) onlyOwner external{
        poolFee = _poolFee;
        emit PoolFeeUpdated(poolFee, msg.sender);
    }

    /// @notice swapExactInputSingle swaps a fixed amount for a maximum possible amount
    /// using the poolFee by calling `exactInputSingle` in the swap router
    /// @dev The calling address must approve this contract to spend at least `amountIn` worth of its amountIn for this function to succeed
    /// @param _amountIn The exact amount of currency that will be swapped
    /// @param _tokenTickerIn The symbol of the amountIn currency
    /// @param _tokenTickerOut The symbold of the amountOut currency
    /// @return _amountOut The maximum amountOut received
    function swapExactInputSingle(uint256 _amountIn, string memory _tokenTickerIn, 
    string memory _tokenTickerOut) external returns (uint256 _amountOut) {
        require(poolFee >= 0, "The PoolFee has not been set");
        require(userBalanceMap[msg.sender][_tokenTickerIn] > 0, "You don't have a balance for this token.");
        require(userBalanceMap[msg.sender][_tokenTickerIn] >= _amountIn, "Your balance is less than the amount you want to swap");
        require(tickerToERC20Contract[_tokenTickerOut] != address(0x0), "You must first register the TokenOut with registerToken method");

        // Approve the router to spend DAI.
        TransferHelper.safeApprove(tickerToERC20Contract[_tokenTickerIn], address(swapRouter), _amountIn);

        // Naively set amountOutMinimum to 0. In production, use an oracle or other data source to choose a safer value for amountOutMinimum.
        // We also set the sqrtPriceLimitx96 to be 0 to ensure we swap our exact input amount.
        ISwapRouter.ExactInputSingleParams memory params =
            ISwapRouter.ExactInputSingleParams({
                tokenIn: tickerToERC20Contract[_tokenTickerIn],
                tokenOut: tickerToERC20Contract[_tokenTickerOut],
                fee: poolFee,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: _amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });
        // The call to `exactInputSingle` executes the swap.
        _amountOut = swapRouter.exactInputSingle(params);

        userBalanceMap[msg.sender][_tokenTickerIn] -= _amountIn;
        userBalanceMap[msg.sender][_tokenTickerOut] += _amountOut;

        emit ExactInputSingle(_tokenTickerIn, _amountIn, _tokenTickerOut, _amountOut, poolFee, msg.sender);
    }

    /// @notice Returns the latest price for a given Oracle Interface
    /// @param _aggregatorV3Interface is the address of the Oracle Interface
    /// @return price the cost of 1 eth in USD
    /// @return decimals the number of decimals to format the price by
    function getLatestPrice(address _aggregatorV3Interface) public view returns (int, uint8) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(_aggregatorV3Interface);
        (
            uint80 roundID, 
            int price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        // If the round is not complete yet, timestamp is 0
        require(timeStamp > 0, "Round not complete");
        return (price, priceFeed.decimals());
    }
}