import HostProfile from "../models/HostProfile.js";

export async function findManagedHost(hostId, userId) {
  const host = await HostProfile.findById(hostId);
  if (!host) {
    return { host: null, isManager: false };
  }
  const isManager = host.managers.some((managerId) => managerId.equals(userId));
  return { host, isManager };
}

export async function requireHostManager(req, res, next) {
  try {
    const { host, isManager } = await findManagedHost(
      req.params.id,
      req.user.id,
    );
    if (!host) {
      return res.status(404).json({ error: "Host not found" });
    }
    if (!isManager) {
      return res.status(403).json({ error: "Forbidden" });
    }
    req.hostProfile = host;
    next();
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ error: "Host not found" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
}
