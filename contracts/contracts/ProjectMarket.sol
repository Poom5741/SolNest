// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IProjectMarket.sol";

contract ProjectMarket is IProjectMarket, ERC20, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant LIFECYCLE_ROLE = keccak256("LIFECYCLE_ROLE");

    IERC20 public immutable usdc;
    address public immutable factory;

    ProjectStatus private _currentStatus;
    ProjectInfo private _project;
    mapping(address => InvestorInfo) private _investors;

    error InvalidStatus();
    error NotHomeowner();
    error ZeroAmount();
    error InsufficientBalance();
    error TransferFailed();
    error TargetNotMet();
    error AlreadyRepaid();
    error FundingEnded();

    modifier onlyStatus(ProjectStatus expected) {
        if (_currentStatus != expected) revert InvalidStatus();
        _;
    }

    modifier onlyHomeowner() {
        if (msg.sender != _project.homeowner) revert NotHomeowner();
        _;
    }

    constructor(
        address _factory,
        address _admin,
        address _usdc,
        address _homeowner,
        uint256 _targetAmount,
        uint256 _apy,
        uint256 _duration,
        uint256 _riskScore,
        string memory _name,
        string memory _symbol,
        string memory _metadataURI
    ) ERC20(_name, _symbol) {
        if (_admin == address(0)) revert("Invalid admin");
        if (_usdc == address(0)) revert("Invalid USDC");
        if (_homeowner == address(0)) revert("Invalid homeowner");
        if (_targetAmount == 0) revert("Target must be > 0");
        if (_duration == 0) revert("Duration must be > 0");

        factory = _factory;
        usdc = IERC20(_usdc);

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(LIFECYCLE_ROLE, _admin);

        _project = ProjectInfo({
            targetAmount: _targetAmount,
            totalFunded: 0,
            totalRepaid: 0,
            apy: _apy,
            duration: _duration,
            riskScore: _riskScore,
            fundingDeadline: block.timestamp + 7 days,
            homeowner: _homeowner,
            metadataURI: _metadataURI,
            createdAt: block.timestamp,
            activatedAt: 0
        });

        _currentStatus = ProjectStatus.Created;
    }

    function deposit(uint256 amount) external nonReentrant onlyStatus(ProjectStatus.Funding) {
        if (amount == 0) revert ZeroAmount();
        if (_project.totalFunded + amount > _project.targetAmount) revert("Exceeds target");
        if (block.timestamp > _project.fundingDeadline) revert FundingEnded();

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        _project.totalFunded += amount;
        _investors[msg.sender].deposited += amount;
        _mint(msg.sender, amount);

        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant onlyStatus(ProjectStatus.Funding) {
        if (amount == 0) revert ZeroAmount();
        if (balanceOf(msg.sender) < amount) revert InsufficientBalance();

        _project.totalFunded -= amount;
        _investors[msg.sender].deposited -= amount;
        _burn(msg.sender, amount);
        usdc.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function repay(uint256 amount) external nonReentrant onlyStatus(ProjectStatus.Active) {
        if (amount == 0) revert ZeroAmount();

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        _project.totalRepaid += amount;

        emit Repaid(msg.sender, amount);
    }

    function claimRewards() external nonReentrant {
        if (_currentStatus != ProjectStatus.Repaid && _currentStatus != ProjectStatus.Defaulted) {
            revert InvalidStatus();
        }

        uint256 lpBalance = balanceOf(msg.sender);
        if (lpBalance == 0) revert InsufficientBalance();

        uint256 totalLpSupply = totalSupply();
        uint256 poolBalance = _project.totalRepaid;

        uint256 share = (lpBalance * poolBalance) / totalLpSupply;
        if (share == 0) revert("Nothing to claim");

        _burn(msg.sender, lpBalance);

        uint256 usdcBalance = usdc.balanceOf(address(this));
        if (usdcBalance < share) revert InsufficientBalance();

        usdc.safeTransfer(msg.sender, share);

        uint256 yieldAmount = share > lpBalance ? share - lpBalance : 0;
        emit Claimed(msg.sender, lpBalance, yieldAmount);
    }

    function startFunding() external onlyRole(LIFECYCLE_ROLE) onlyStatus(ProjectStatus.Created) {
        _currentStatus = ProjectStatus.Funding;
        emit StatusChanged(ProjectStatus.Funding);
    }

    function activate() external onlyRole(LIFECYCLE_ROLE) onlyStatus(ProjectStatus.Funding) {
        if (_project.totalFunded < _project.targetAmount) revert TargetNotMet();
        _project.activatedAt = block.timestamp;
        _currentStatus = ProjectStatus.Active;
        emit StatusChanged(ProjectStatus.Active);
    }

    function finalizeProject() external onlyRole(LIFECYCLE_ROLE) onlyStatus(ProjectStatus.Active) {
        if (_project.totalRepaid < _project.targetAmount) revert TargetNotMet();
        _currentStatus = ProjectStatus.Repaid;
        emit StatusChanged(ProjectStatus.Repaid);
    }

    function markDefaulted() external onlyRole(LIFECYCLE_ROLE) onlyStatus(ProjectStatus.Active) {
        _currentStatus = ProjectStatus.Defaulted;
        emit StatusChanged(ProjectStatus.Defaulted);
    }

    function getProjectInfo() external view returns (ProjectInfo memory) {
        return _project;
    }

    function getInvestorInfo(address investor) external view returns (InvestorInfo memory) {
        return _investors[investor];
    }

    function status() external view returns (ProjectStatus) {
        return _currentStatus;
    }
}
