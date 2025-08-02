        // SPDX-License-Identifier: MIT
        pragma solidity ^0.8.19;

        import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
        import "@openzeppelin/contracts/access/Ownable.sol";
        import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

        /**
         * @title SbFTMarketplace
         * @dev Simple marketplace for trading sbFT tokens with USDC
         */
        contract SbFTMarketplace is Ownable, ReentrancyGuard {
            
            IERC20 public sbftToken;
            IERC20 public usdcToken;
            
            // Trading parameters
            uint256 public tradingFee = 250; // 2.5% fee (250 basis points)
            uint256 public constant BASIS_POINTS = 10000;
            uint256 public constant MIN_ORDER_SIZE = 1e18; // 1 sbFT minimum
            
            // Order structure
            struct Order {
                uint256 id;
                address user;
                bool isBuyOrder;        // true = buy, false = sell
                uint256 sbftAmount;     // Amount of sbFT tokens
                uint256 usdcPrice;      // Price per sbFT in USDC (scaled by 1e6)
                uint256 totalValue;     // Total USDC value
                uint256 filled;         // Amount already filled
                uint256 timestamp;
                bool active;
            }
            
            // Storage
            mapping(uint256 => Order) public orders;
            mapping(address => uint256[]) public userOrders;
            uint256 public orderCount;
            
            // Active order arrays for efficient matching
            uint256[] public activeBuyOrders;
            uint256[] public activeSellOrders;
            
            // Trading stats
            uint256 public totalVolume;
            uint256 public totalTrades;
            uint256 public feesCollected;
            
            // Events for subgraph
            event OrderCreated(
                uint256 indexed orderId,
                address indexed user,
                bool isBuyOrder,
                uint256 sbftAmount,
                uint256 usdcPrice,
                uint256 totalValue
            );
            
            event OrderFilled(
                uint256 indexed orderId,
                address indexed buyer,
                address indexed seller,
                uint256 sbftAmount,
                uint256 usdcAmount,
                uint256 fee
            );
            
            event OrderCanceled(uint256 indexed orderId, address indexed user);
            event TradingFeeUpdated(uint256 newFee);
            event FeesWithdrawn(address indexed to, uint256 amount);
            
            constructor(
                address _sbftToken,
                address _usdcToken
            ) Ownable(msg.sender) {
                require(_sbftToken != address(0), "Invalid sbFT token");
                require(_usdcToken != address(0), "Invalid USDC token");
                
                sbftToken = IERC20(_sbftToken);
                usdcToken = IERC20(_usdcToken);
            }
            
            /**
             * @dev Create a buy order for sbFT tokens
             * @param sbftAmount Amount of sbFT tokens to buy
             * @param usdcPrice Price per sbFT in USDC (scaled by 1e6)
             */
            function createBuyOrder(uint256 sbftAmount, uint256 usdcPrice) external nonReentrant {
                require(sbftAmount >= MIN_ORDER_SIZE, "Order below minimum size");
                require(usdcPrice > 0, "Price must be greater than 0");
                
                uint256 totalValue = (sbftAmount * usdcPrice) / 1e18;
                require(totalValue > 0, "Total value must be greater than 0");
                require(usdcToken.balanceOf(msg.sender) >= totalValue, "Insufficient USDC balance");
                
                // Transfer USDC to contract
                require(usdcToken.transferFrom(msg.sender, address(this), totalValue), "USDC transfer failed");
                
                // Create order
                uint256 orderId = orderCount++;
                orders[orderId] = Order({
                    id: orderId,
                    user: msg.sender,
                    isBuyOrder: true,
                    sbftAmount: sbftAmount,
                    usdcPrice: usdcPrice,
                    totalValue: totalValue,
                    filled: 0,
                    timestamp: block.timestamp,
                    active: true
                });
                
                userOrders[msg.sender].push(orderId);
                activeBuyOrders.push(orderId);
                
                emit OrderCreated(orderId, msg.sender, true, sbftAmount, usdcPrice, totalValue);
                
                // Try to match with existing sell orders
                _matchOrders(orderId);
            }
            
            /**
             * @dev Create a sell order for sbFT tokens
             * @param sbftAmount Amount of sbFT tokens to sell
             * @param usdcPrice Price per sbFT in USDC (scaled by 1e6)
             */
            function createSellOrder(uint256 sbftAmount, uint256 usdcPrice) external nonReentrant {
                require(sbftAmount >= MIN_ORDER_SIZE, "Order below minimum size");
                require(usdcPrice > 0, "Price must be greater than 0");
                require(sbftToken.balanceOf(msg.sender) >= sbftAmount, "Insufficient sbFT balance");
                
                uint256 totalValue = (sbftAmount * usdcPrice) / 1e18;
                
                // Transfer sbFT to contract
                require(sbftToken.transferFrom(msg.sender, address(this), sbftAmount), "sbFT transfer failed");
                
                // Create order
                uint256 orderId = orderCount++;
                orders[orderId] = Order({
                    id: orderId,
                    user: msg.sender,
                    isBuyOrder: false,
                    sbftAmount: sbftAmount,
                    usdcPrice: usdcPrice,
                    totalValue: totalValue,
                    filled: 0,
                    timestamp: block.timestamp,
                    active: true
                });
                
                userOrders[msg.sender].push(orderId);
                activeSellOrders.push(orderId);
                
                emit OrderCreated(orderId, msg.sender, false, sbftAmount, usdcPrice, totalValue);
                
                // Try to match with existing buy orders
                _matchOrders(orderId);
            }
            
            /**
             * @dev Cancel an active order
             * @param orderId ID of the order to cancel
             */
            function cancelOrder(uint256 orderId) external nonReentrant {
                require(orderId < orderCount, "Order does not exist");
                
                Order storage order = orders[orderId];
                require(order.user == msg.sender, "Not your order");
                require(order.active, "Order not active");
                
                order.active = false;
                
                // Return funds to user
                if (order.isBuyOrder) {
                    uint256 remainingValue = ((order.sbftAmount - order.filled) * order.usdcPrice) / 1e18;
                    if (remainingValue > 0) {
                        require(usdcToken.transfer(msg.sender, remainingValue), "USDC return failed");
                    }
                } else {
                    uint256 remainingAmount = order.sbftAmount - order.filled;
                    if (remainingAmount > 0) {
                        require(sbftToken.transfer(msg.sender, remainingAmount), "sbFT return failed");
                    }
                }
                
                // Remove from active orders
                _removeFromActiveOrders(orderId);
                
                emit OrderCanceled(orderId, msg.sender);
            }
            
            /**
             * @dev Get active buy orders
             * @return Array of active buy order IDs
             */
            function getActiveBuyOrders() external view returns (uint256[] memory) {
                return activeBuyOrders;
            }
            
            /**
             * @dev Get active sell orders
             * @return Array of active sell order IDs
             */
            function getActiveSellOrders() external view returns (uint256[] memory) {
                return activeSellOrders;
            }
            
            /**
             * @dev Get user's orders
             * @param user Address of the user
             * @return Array of order IDs for the user
             */
            function getUserOrders(address user) external view returns (uint256[] memory) {
                return userOrders[user];
            }
            
            /**
             * @dev Get order details
             * @param orderId ID of the order
             * @return Order details
             */
            function getOrder(uint256 orderId) external view returns (Order memory) {
                return orders[orderId];
            }
            
            /**
             * @dev Get market stats
             * @return totalVolume Total trading volume
             * @return totalTrades Total number of trades
             * @return feesCollected Total fees collected
             */
            function getMarketStats() external view returns (uint256, uint256, uint256) {
                return (totalVolume, totalTrades, feesCollected);
            }
            
            /**
             * @dev Update trading fee (only owner)
             * @param newFee New fee in basis points (max 1000 = 10%)
             */
            function updateTradingFee(uint256 newFee) external onlyOwner {
                require(newFee <= 1000, "Fee cannot exceed 10%");
                tradingFee = newFee;
                emit TradingFeeUpdated(newFee);
            }
            
            /**
             * @dev Withdraw collected fees (only owner)
             * @param to Address to withdraw fees to
             */
            function withdrawFees(address to) external onlyOwner {
                require(to != address(0), "Invalid address");
                uint256 balance = usdcToken.balanceOf(address(this));
                
                // Calculate fees available (total balance minus locked order funds)
                uint256 availableFees = _calculateAvailableFees();
                require(availableFees > 0, "No fees to withdraw");
                
                require(usdcToken.transfer(to, availableFees), "Fee withdrawal failed");
                
                emit FeesWithdrawn(to, availableFees);
            }
            
            /**
             * @dev Internal function to match orders
             * @param newOrderId ID of the new order
             */
            function _matchOrders(uint256 newOrderId) internal {
                Order storage newOrder = orders[newOrderId];
                
                if (newOrder.isBuyOrder) {
                    // Match buy order with sell orders
                    for (uint256 i = 0; i < activeSellOrders.length; i++) {
                        uint256 sellOrderId = activeSellOrders[i];
                        Order storage sellOrder = orders[sellOrderId];
                        
                        if (!sellOrder.active) continue;
                        if (sellOrder.usdcPrice > newOrder.usdcPrice) continue; // Price doesn't match
                        
                        _executeTrade(newOrderId, sellOrderId);
                        
                        if (!newOrder.active) break; // New order fully filled
                    }
                } else {
                    // Match sell order with buy orders
                    for (uint256 i = 0; i < activeBuyOrders.length; i++) {
                        uint256 buyOrderId = activeBuyOrders[i];
                        Order storage buyOrder = orders[buyOrderId];
                        
                        if (!buyOrder.active) continue;
                        if (buyOrder.usdcPrice < newOrder.usdcPrice) continue; // Price doesn't match
                        
                        _executeTrade(buyOrderId, newOrderId);
                        
                        if (!newOrder.active) break; // New order fully filled
                    }
                }
            }
            
            /**
             * @dev Execute a trade between two orders
             * @param buyOrderId ID of the buy order
             * @param sellOrderId ID of the sell order
             */
            function _executeTrade(uint256 buyOrderId, uint256 sellOrderId) internal {
                Order storage buyOrder = orders[buyOrderId];
                Order storage sellOrder = orders[sellOrderId];
                
                // Calculate trade amount
                uint256 buyRemaining = buyOrder.sbftAmount - buyOrder.filled;
                uint256 sellRemaining = sellOrder.sbftAmount - sellOrder.filled;
                uint256 tradeAmount = buyRemaining < sellRemaining ? buyRemaining : sellRemaining;
                
                // Calculate USDC value (use buy order price)
                uint256 tradeValue = (tradeAmount * buyOrder.usdcPrice) / 1e18;
                
                // Calculate fee
                uint256 fee = (tradeValue * tradingFee) / BASIS_POINTS;
                uint256 netValue = tradeValue - fee;
                
                // Update order fills
                buyOrder.filled += tradeAmount;
                sellOrder.filled += tradeAmount;
                
                // Transfer tokens
                require(sbftToken.transfer(buyOrder.user, tradeAmount), "sbFT transfer to buyer failed");
                require(usdcToken.transfer(sellOrder.user, netValue), "USDC transfer to seller failed");
                
                // Update stats
                totalVolume += tradeValue;
                totalTrades++;
                feesCollected += fee;
                
                // Check if orders are fully filled
                if (buyOrder.filled == buyOrder.sbftAmount) {
                    buyOrder.active = false;
                    _removeFromActiveOrders(buyOrderId);
                }
                
                if (sellOrder.filled == sellOrder.sbftAmount) {
                    sellOrder.active = false;
                    _removeFromActiveOrders(sellOrderId);
                }
                
                emit OrderFilled(
                    buyOrderId,
                    buyOrder.user,
                    sellOrder.user,
                    tradeAmount,
                    tradeValue,
                    fee
                );
            }
            
            /**
             * @dev Remove order from active orders array
             * @param orderId ID of the order to remove
             */
            function _removeFromActiveOrders(uint256 orderId) internal {
                Order storage order = orders[orderId];
                
                if (order.isBuyOrder) {
                    for (uint256 i = 0; i < activeBuyOrders.length; i++) {
                        if (activeBuyOrders[i] == orderId) {
                            activeBuyOrders[i] = activeBuyOrders[activeBuyOrders.length - 1];
                            activeBuyOrders.pop();
                            break;
                        }
                    }
                } else {
                    for (uint256 i = 0; i < activeSellOrders.length; i++) {
                        if (activeSellOrders[i] == orderId) {
                            activeSellOrders[i] = activeSellOrders[activeSellOrders.length - 1];
                            activeSellOrders.pop();
                            break;
                        }
                    }
                }
            }
            
            /**
             * @dev Calculate available fees for withdrawal
             * @return Available fees amount
             */
            function _calculateAvailableFees() internal view returns (uint256) {
                uint256 totalBalance = usdcToken.balanceOf(address(this));
                uint256 lockedFunds = 0;
                
                // Calculate locked funds in active buy orders
                for (uint256 i = 0; i < activeBuyOrders.length; i++) {
                    Order storage order = orders[activeBuyOrders[i]];
                    if (order.active) {
                        uint256 remaining = order.sbftAmount - order.filled;
                        lockedFunds += (remaining * order.usdcPrice) / 1e18;
                    }
                }
                
                return totalBalance > lockedFunds ? totalBalance - lockedFunds : 0;
            }
        }