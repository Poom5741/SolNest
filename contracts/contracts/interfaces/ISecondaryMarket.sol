// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ISecondaryMarket
 * @notice Interface for the P2P escrow secondary market for LP token trading
 */
interface ISecondaryMarket {
    /**
     * @notice Status of a listing
     */
    enum ListingStatus {
        Active,
        Cancelled,
        Expired,
        Completed
    }

    /**
     * @notice A listing in the secondary market
     * @param id Unique listing identifier
     * @param seller Address that created the listing
     * @param tokenContract The LP token contract being traded
     * @param amount Total number of LP tokens listed
     * @param remaining Amount of LP tokens still available for purchase
     * @param pricePerUnit Price per LP token in USDC (18 decimals)
     * @param expiresAt Timestamp when the listing expires
     * @param status Current listing status
     */
    struct Listing {
        uint256 id;
        address seller;
        IERC20 tokenContract;
        uint256 amount;
        uint256 remaining;
        uint256 pricePerUnit;
        uint256 expiresAt;
        ListingStatus status;
    }

    /**
     * @notice Emitted when a new listing is created
     * @param listingId The unique ID of the listing
     * @param seller The address of the seller
     * @param tokenContract The LP token contract
     * @param amount The total amount of LP tokens listed
     * @param pricePerUnit The price per LP token in USDC
     * @param expiresAt The expiration timestamp
     */
    event Listed(
        uint256 indexed listingId,
        address indexed seller,
        IERC20 indexed tokenContract,
        uint256 amount,
        uint256 pricePerUnit,
        uint256 expiresAt
    );

    /**
     * @notice Emitted when LP tokens are purchased from a listing
     * @param listingId The listing ID
     * @param buyer The address of the buyer
     * @param seller The address of the seller
     * @param tokenContract The LP token contract
     * @param amount The amount of LP tokens purchased
     * @param totalCost The total USDC paid (including fee)
     * @param feeAmount The fee collected in USDC
     */
    event Purchased(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        IERC20 tokenContract,
        uint256 amount,
        uint256 totalCost,
        uint256 feeAmount
    );

    /**
     * @notice Emitted when a listing is cancelled by seller or admin
     * @param listingId The cancelled listing ID
     * @param seller The seller who received back the escrowed LP tokens
     * @param amount The amount of LP tokens returned
     */
    event Cancelled(
        uint256 indexed listingId,
        address indexed seller,
        uint256 amount
    );

    /**
     * @notice Emitted when the fee configuration is updated
     * @param oldFeeBps The previous fee in basis points
     * @param newFeeBps The new fee in basis points
     * @param updatedBy The address that made the change
     */
    event FeeUpdated(
        uint256 oldFeeBps,
        uint256 newFeeBps,
        address indexed updatedBy
    );

    /**
     * @notice Emitted when the fee collector address is changed
     * @param oldCollector The previous fee collector
     * @param newCollector The new fee collector
     */
    event FeeCollectorUpdated(
        address indexed oldCollector,
        address indexed newCollector
    );

    /**
     * @notice List LP tokens for sale on the secondary market
     * @param tokenContract The LP token contract to list
     * @param amount The amount of LP tokens to list
     * @param pricePerUnit The price per LP token in USDC (18 decimals)
     * @param durationDays Number of days until listing expires
     * @return listingId The ID of the created listing
     */
    function list(
        IERC20 tokenContract,
        uint256 amount,
        uint256 pricePerUnit,
        uint256 durationDays
    ) external returns (uint256 listingId);

    /**
     * @notice Purchase LP tokens from an active listing
     * @param listingId The listing to buy from
     * @param amount The amount of LP tokens to purchase
     */
    function buy(uint256 listingId, uint256 amount) external;

    /**
     * @notice Cancel an active listing and reclaim escrowed LP tokens
     * @param listingId The listing to cancel
     */
    function cancel(uint256 listingId) external;

    /**
     * @notice Set the marketplace fee in basis points (1 bps = 0.01%)
     * @param newFeeBps The new fee in basis points (max 10000 = 100%)
     */
    function setFee(uint256 newFeeBps) external;

    /**
     * @notice Set the fee collector address
     * @param newCollector The address to receive marketplace fees
     */
    function setFeeCollector(address newCollector) external;

    /**
     * @notice Get a specific listing
     * @param listingId The listing ID to look up
     * @return The full Listing struct
     */
    function getListing(uint256 listingId) external view returns (Listing memory);

    /**
     * @notice Get the total number of listings created
     * @return The next (unused) listing ID
     */
    function getListingCount() external view returns (uint256);

    /**
     * @notice Get the current marketplace fee in basis points
     * @return The fee in bps
     */
    function feeBps() external view returns (uint256);

    /**
     * @notice Get the fee collector address
     * @return The fee collector address
     */
    function feeCollector() external view returns (address);
}
