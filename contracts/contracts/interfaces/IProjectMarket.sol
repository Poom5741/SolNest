// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IProjectMarket {
    enum ProjectStatus { Created, Funding, Active, Repaid, Defaulted }

    struct ProjectInfo {
        uint256 targetAmount;
        uint256 totalFunded;
        uint256 totalRepaid;
        uint256 apy;
        uint256 duration;
        uint256 riskScore;
        uint256 fundingDeadline;
        address homeowner;
        string metadataURI;
        uint256 createdAt;
        uint256 activatedAt;
    }

    struct InvestorInfo {
        uint256 deposited;
    }

    event Deposited(address indexed investor, uint256 amount);
    event Withdrawn(address indexed investor, uint256 amount);
    event Repaid(address indexed from, uint256 amount);
    event Claimed(address indexed investor, uint256 principal, uint256 yieldAmount);
    event StatusChanged(ProjectStatus indexed newStatus);

    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function repay(uint256 amount) external;
    function claimRewards() external;

    function startFunding() external;
    function activate() external;
    function finalizeProject() external;
    function markDefaulted() external;

    function getProjectInfo() external view returns (ProjectInfo memory);
    function getInvestorInfo(address investor) external view returns (InvestorInfo memory);
    function status() external view returns (ProjectStatus);
}
