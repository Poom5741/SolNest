// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/ISecondaryMarket.sol";

contract SecondaryMarket is ISecondaryMarket, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant FEE_ROLE = keccak256("FEE_ROLE");

    IERC20 public immutable usdc;
    address public feeCollector;
    uint256 public feeBasisPoints;
    uint256 public nextListingId;
    mapping(uint256 => Listing) public listings;

    error ZeroAmount();
    error ZeroPrice();
    error ZeroDuration();
    error ZeroAddress();
    error ListingNotActive();
    error ListingExpired();
    error SelfPurchase();
    error Unauthorized();
    error FeeTooHigh();

    constructor(
        address _usdc,
        address _admin,
        address _feeCollector,
        uint256 _feeBasisPoints
    ) {
        if (_usdc == address(0)) revert ZeroAddress();
        if (_admin == address(0)) revert ZeroAddress();
        if (_feeCollector == address(0)) revert ZeroAddress();
        if (_feeBasisPoints > 10000) revert FeeTooHigh();

        usdc = IERC20(_usdc);
        feeCollector = _feeCollector;
        feeBasisPoints = _feeBasisPoints;

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(FEE_ROLE, _admin);
    }

    function list(
        address tokenContract,
        uint256 amount,
        uint256 price,
        uint256 durationDays
    ) external nonReentrant returns (uint256 listingId) {
        if (amount == 0) revert ZeroAmount();
        if (price == 0) revert ZeroPrice();
        if (durationDays == 0) revert ZeroDuration();
        if (tokenContract == address(0)) revert ZeroAddress();

        listingId = nextListingId;
        nextListingId++;

        uint256 expiresAt = block.timestamp + (durationDays * 1 days);

        listings[listingId] = Listing({
            id: listingId,
            seller: msg.sender,
            tokenContract: tokenContract,
            amount: amount,
            price: price,
            expiresAt: expiresAt,
            active: true
        });

        IERC20(tokenContract).safeTransferFrom(msg.sender, address(this), amount);

        emit Listed(listingId, msg.sender, tokenContract, amount, price);
    }

    function buy(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];

        if (!listing.active) revert ListingNotActive();
        if (block.timestamp >= listing.expiresAt) revert ListingExpired();
        if (msg.sender == listing.seller) revert SelfPurchase();

        listing.active = false;

        uint256 fee = (listing.price * feeBasisPoints) / 10000;

        // Seller receives full listed price (D-12)
        usdc.safeTransferFrom(msg.sender, listing.seller, listing.price);

        // Fee collected from buyer on top of listing price (D-08, D-12)
        if (fee > 0) {
            usdc.safeTransferFrom(msg.sender, feeCollector, fee);
        }

        // Transfer escrowed LP tokens to buyer
        IERC20(listing.tokenContract).safeTransfer(msg.sender, listing.amount);

        emit Purchased(listingId, msg.sender, fee);
    }

    function cancel(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];

        if (!listing.active) revert ListingNotActive();
        if (msg.sender != listing.seller && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert Unauthorized();
        }

        listing.active = false;

        IERC20(listing.tokenContract).safeTransfer(listing.seller, listing.amount);

        emit Cancelled(listingId);
    }

    function setFee(uint256 newFeeBps) external onlyRole(FEE_ROLE) {
        if (newFeeBps > 10000) revert FeeTooHigh();

        feeBasisPoints = newFeeBps;

        emit FeeUpdated(newFeeBps);
    }
}
