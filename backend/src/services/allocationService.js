const Branch = require("../models/Branch");
const calculateDistance = require("../utils/calculateDistance");

const allocateBranch = async (items, customerLocation) => {
  const branches = await Branch.find({ isActive: true });

  const eligibleBranches = [];

  for (const branch of branches) {
    let canFulfillOrder = true;
    let totalRemainingStock = 0;

    for (const item of items) {
      const stockItem = branch.stock.find(
        (stock) =>
          stock.productId.toString() === item.productId.toString()
      );

      if (!stockItem || stockItem.quantity < item.quantity) {
        canFulfillOrder = false;
        break;
      }

      totalRemainingStock += stockItem.quantity - item.quantity;
    }

    if (!canFulfillOrder) {
      continue;
    }

    const distance = calculateDistance(
      customerLocation.latitude,
      customerLocation.longitude,
      branch.location.latitude,
      branch.location.longitude
    );

    eligibleBranches.push({
      branch,
      distance,
      workload: branch.currentWorkload,
      remainingStock: totalRemainingStock,
    });
  }

  if (eligibleBranches.length === 0) {
    return null;
  }

  const maxDistance = Math.max(
    ...eligibleBranches.map((candidate) => candidate.distance),
    1
  );

  const maxWorkload = Math.max(
    ...eligibleBranches.map((candidate) => candidate.workload),
    1
  );

  const maxRemainingStock = Math.max(
    ...eligibleBranches.map((candidate) => candidate.remainingStock),
    1
  );

  for (const candidate of eligibleBranches) {
    const normalizedDistance = candidate.distance / maxDistance;

    const normalizedWorkload =
      candidate.workload / maxWorkload;

    // More remaining stock is better, therefore convert it into a penalty.
    const stockPenalty =
      1 - candidate.remainingStock / maxRemainingStock;

    candidate.score =
      normalizedDistance * 0.5 +
      normalizedWorkload * 0.3 +
      stockPenalty * 0.2;
  }

  eligibleBranches.sort((a, b) => {
    if (a.score !== b.score) {
      return a.score - b.score;
    }

    // Deterministic tie-breaker
    return a.branch._id
      .toString()
      .localeCompare(b.branch._id.toString());
  });

  return eligibleBranches[0];
};

module.exports = allocateBranch;