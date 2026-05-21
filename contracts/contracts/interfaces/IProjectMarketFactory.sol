// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IProjectMarketFactory {
    event ProjectCreated(
        uint256 indexed projectId,
        address indexed market,
        address indexed homeowner,
        uint256 targetAmount,
        uint256 apy,
        uint256 duration
    );

    function createProject(
        address _homeowner,
        uint256 _targetAmount,
        uint256 _apy,
        uint256 _duration,
        uint256 _riskScore,
        string memory _metadataURI
    ) external returns (address);

    function getProject(uint256 index) external view returns (address);
    function getProjectCount() external view returns (uint256);
    function usdcToken() external view returns (address);
}
