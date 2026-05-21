// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IProjectMarketFactory.sol";
import "./ProjectMarket.sol";

contract ProjectMarketFactory is IProjectMarketFactory, AccessControl {
    IERC20 private immutable _usdcToken;

    address[] private _projects;

    uint256 private _nextProjectId;

    error NotAdmin();
    error ZeroAddress();
    error ZeroTarget();

    modifier onlyAdmin() {
        if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) revert NotAdmin();
        _;
    }

    constructor(address _usdc) {
        if (_usdc == address(0)) revert ZeroAddress();
        _usdcToken = IERC20(_usdc);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function usdcToken() external view override returns (address) {
        return address(_usdcToken);
    }

    function createProject(
        address _homeowner,
        uint256 _targetAmount,
        uint256 _apy,
        uint256 _duration,
        uint256 _riskScore,
        string memory _metadataURI
    ) external onlyAdmin returns (address) {
        if (_homeowner == address(0)) revert ZeroAddress();
        if (_targetAmount == 0) revert ZeroTarget();

        uint256 projectId = _nextProjectId;

        string memory name = string(abi.encodePacked("SolNest LP v", _toString(projectId)));
        string memory symbol = string(abi.encodePacked("snLP-", _toString(projectId)));

        ProjectMarket market = new ProjectMarket(
            address(this),
            msg.sender,
            address(_usdcToken),
            _homeowner,
            _targetAmount,
            _apy,
            _duration,
            _riskScore,
            name,
            symbol,
            _metadataURI
        );

        _projects.push(address(market));
        _nextProjectId++;

        emit ProjectCreated(
            projectId,
            address(market),
            _homeowner,
            _targetAmount,
            _apy,
            _duration
        );

        return address(market);
    }

    function getProject(uint256 index) external view returns (address) {
        if (index >= _projects.length) revert("Index out of bounds");
        return _projects[index];
    }

    function getProjectCount() external view returns (uint256) {
        return _projects.length;
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
