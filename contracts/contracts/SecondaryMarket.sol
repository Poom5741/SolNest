// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/ISecondaryMarket.sol";

/**
 * @title SecondaryMarket
 * @notice P2P on-chain escrow market for LP token trading with USDC pricing
 * @dev Uses AccessControl for admin/fee roles, ReentrancyGuard for transfer safety,
 *      SafeERC20 for token transfers, and Pausable for emergency stops.
 */
contract SecondaryMarket is ISecondaryMarket, AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ──── Custom Errors ───────────────────────────────────────────────

    error ZeroAmount();
    error ZeroPrice();
    error ZeroDuration();
    error ZeroAddress();
    error Unauthorized();
    error ListingNotFound();
    error ListingNotActive();
    error ExpiredListing();
    error SelfPurchase();
    error InsufficientRemaining();
    error InsufficientUSDCBalance();
    error InsufficientLPAllowance();
    error FeeTooHigh();
    error TransferFailed();

    // ──── Roles ────────────────────────────────────────────────────────

    bytes32 public constant FEE_ROLE = keccak256("FEE_ROLE");

    // ──── State Variables ──────────────────────────────────────────────

    /// @notice The USDC stablecoin used for pricing
    IERC20 public immutable usdc;

    /// @notice Marketplace fee in basis points (e.g. 250 = 2.5%)
    uint256 public feeBps;

    /// @notice Address that collects marketplace fees
    address public feeCollector;

    /// @notice Total number of listings created (also next listing ID)
    uint256 private _listingCount;

    /// @notice Mapping from listing ID to Listing struct
    mapping(uint256 => Listing) private _listings;

    // ──── Constructor ──────────────────────────────────────────────────

    /**
     * @param _usdc The USDC token contract address
     * @param _admin The default admin address
     * @param _feeCollector The initial fee collector address
     * @param _feeBps The initial marketplace fee in basis points
     */
    constructor(
        IERC20 _usdc,
        address _admin,
        address _feeCollector,
        uint256 _feeBps
    ) {
        if (address(_usdc) == address(0)) revert ZeroAddress();
        if (_admin == address(0)) revert ZeroAddress();
        if (_feeCollector == address(0)) revert ZeroAddress();
        if (_feeBps > 10000) revert FeeTooHigh();

        usdc = _usdc;
        feeCollector = _feeCollector;
        feeBps = _feeBps;

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(FEE_ROLE, _admin);
    }

    // ──── Modifiers ────────────────────────────────────────────────────

    /**
     * @notice Reverts if the listing does not exist
     */
    modifier listingExists(uint256 _listingId) {
        if (_listingId == 0 || _listingId > _listingCount) revert ListingNotFound();
        _;
    }

    /**
     * @notice Reverts if the listing is not in Active status
     * @dev Also auto-expires listings that have passed their expiration time
     */
    modifier onlyActive(uint256 _listingId) {
        Listing storage listing = _listings[_listingId];
        if (listing.status != ListingStatus.Active) revert ListingNotActive();
        if (block.timestamp >= listing.expiresAt) {
            listing.status = ListingStatus.Expired;
            revert ExpiredListing();
        }
        _;
    }

    // ──── Core Functions ───────────────────────────────────────────────

    /**
     * @notice List LP tokens for sale on the secondary market
     * @dev Transfers LP tokens from seller to this contract (escrow)
     * @param _tokenContract The LP token contract to list
     * @param _amount The amount of LP tokens to list
     * @param _pricePerUnit The price per LP token in USDC (18 decimals)
     * @param _durationDays Number of days until listing expires
     * @return listingId The ID of the created listing
     */
    function list(
        IERC20 _tokenContract,
        uint256 _amount,
        uint256 _pricePerUnit,
        uint256 _durationDays
    ) external nonReentrant whenNotPaused returns (uint256 listingId) {
        if (_amount == 0) revert ZeroAmount();
        if (_pricePerUnit == 0) revert ZeroPrice();
        if (_durationDays == 0) revert ZeroDuration();
        if (address(_tokenContract) == address(0)) revert ZeroAddress();

        _listingCount++;
        listingId = _listingCount;

        uint256 expiresAt = block.timestamp + (_durationDays * 1 days);

        _listings[listingId] = Listing({
            id: listingId,
            seller: msg.sender,
            tokenContract: _tokenContract,
            amount: _amount,
            remaining: _amount,
            pricePerUnit: _pricePerUnit,
            expiresAt: expiresAt,
            status: ListingStatus.Active
        });

        // Escrow: transfer LP tokens from seller to this contract
        _tokenContract.safeTransferFrom(msg.sender, address(this), _amount);

        emit Listed(listingId, msg.sender, _tokenContract, _amount, _pricePerUnit, expiresAt);
    }

    /**
     * @notice Purchase LP tokens from an active listing
     * @dev Calculates cost + fee, transfers USDC from buyer to seller and fee collector,
     *      then transfers LP tokens from escrow to buyer.
     * @param _listingId The listing to buy from
     * @param _amount The amount of LP tokens to purchase
     */
    function buy(
        uint256 _listingId,
        uint256 _amount
    ) external nonReentrant whenNotPaused listingExists(_listingId) onlyActive(_listingId) {
        Listing storage listing = _listings[_listingId];

        if (_amount == 0) revert ZeroAmount();
        if (_amount > listing.remaining) revert InsufficientRemaining();
        if (msg.sender == listing.seller) revert SelfPurchase();

        // Calculate cost
        uint256 baseCost = _amount * listing.pricePerUnit;
        uint256 feeAmount = (baseCost * feeBps) / 10000;
        uint256 totalCost = baseCost + feeAmount;

        // Transfer USDC from buyer: fee to feeCollector, base to seller
        usdc.safeTransferFrom(msg.sender, feeCollector, feeAmount);
        usdc.safeTransferFrom(msg.sender, listing.seller, baseCost);

        // Transfer LP tokens from escrow to buyer
        listing.remaining -= _amount;
        listing.tokenContract.safeTransfer(msg.sender, _amount);

        emit Purchased(
            _listingId,
            msg.sender,
            listing.seller,
            listing.tokenContract,
            _amount,
            totalCost,
            feeAmount
        );

        // Mark as completed if fully sold
        if (listing.remaining == 0) {
            listing.status = ListingStatus.Completed;
        }
    }

    /**
     * @notice Cancel an active listing and reclaim escrowed LP tokens
     * @dev Only the seller or an admin can cancel
     * @param _listingId The listing to cancel
     */
    function cancel(
        uint256 _listingId
    ) external nonReentrant listingExists(_listingId) {
        Listing storage listing = _listings[_listingId];

        if (listing.status != ListingStatus.Active) revert ListingNotActive();
        if (msg.sender != listing.seller && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert Unauthorized();
        }

        listing.status = ListingStatus.Cancelled;
        uint256 remaining = listing.remaining;

        // Return escrowed LP tokens to seller
        listing.tokenContract.safeTransfer(listing.seller, remaining);

        emit Cancelled(_listingId, listing.seller, remaining);
    }

    // ──── Admin Functions ──────────────────────────────────────────────

    /**
     * @notice Set the marketplace fee in basis points
     * @dev Requires FEE_ROLE. Max 10000 bps (100%)
     * @param _newFeeBps The new fee in basis points
     */
    function setFee(uint256 _newFeeBps) external onlyRole(FEE_ROLE) {
        if (_newFeeBps > 10000) revert FeeTooHigh();

        uint256 oldFeeBps = feeBps;
        feeBps = _newFeeBps;

        emit FeeUpdated(oldFeeBps, _newFeeBps, msg.sender);
    }

    /**
     * @notice Set the fee collector address
     * @dev Requires DEFAULT_ADMIN_ROLE
     * @param _newCollector The address to receive marketplace fees
     */
    function setFeeCollector(address _newCollector) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_newCollector == address(0)) revert ZeroAddress();

        address oldCollector = feeCollector;
        feeCollector = _newCollector;

        emit FeeCollectorUpdated(oldCollector, _newCollector);
    }

    /**
     * @notice Pause the contract (emergency stop)
     * @dev Requires DEFAULT_ADMIN_ROLE
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause the contract
     * @dev Requires DEFAULT_ADMIN_ROLE
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // ──── View Functions ───────────────────────────────────────────────

    /**
     * @notice Get a specific listing
     * @param _listingId The listing ID to look up
     * @return The full Listing struct
     */
    function getListing(uint256 _listingId) external view listingExists(_listingId) returns (Listing memory) {
        return _listings[_listingId];
    }

    /**
     * @notice Get the total number of listings created
     * @return The next (unused) listing ID
     */
    function getListingCount() external view returns (uint256) {
        return _listingCount;
    }
}
