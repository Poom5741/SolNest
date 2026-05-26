// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ISecondaryMarket {
    struct Listing {
        uint256 id;
        address seller;
        address tokenContract;
        uint256 amount;
        uint256 price;
        uint256 expiresAt;
        bool active;
    }

    event Listed(uint256 indexed listingId, address indexed seller, address token, uint256 amount, uint256 price);
    event Purchased(uint256 indexed listingId, address indexed buyer, uint256 fee);
    event Cancelled(uint256 indexed listingId);
    event FeeUpdated(uint256 newFeeBps);

    function list(address tokenContract, uint256 amount, uint256 price, uint256 durationDays) external returns (uint256);
    function buy(uint256 listingId) external;
    function cancel(uint256 listingId) external;
    function setFee(uint256 newFeeBps) external;
}
