// Sync conflict detection.
// Pure function. A phone record conflicts with the server when the server changed the same stop
// AFTER the phone's record was made on the device, and the two say different things.
// Clean records are accepted silently. Real conflicts go to a person (driver screen DR6).

/**
 * @param {{clientId,orderId,status,recordedAt}} phone      record from the phone outbox
 * @param {{status,changedAt,changedBy,reason}|null} server current server state of that order/stop
 * @returns {{conflict:boolean, why?:string}}
 */
export function detectConflict(phone, server) {
  if (!server) return { conflict: false };
  const serverChangedAfterPhoneLost =
    server.changedAt && new Date(server.changedAt).getTime() <= new Date(phone.recordedAt).getTime();
  // Example: dispatch moved the order to Wednesday at 10:02, phone delivered it at 10:08.
  if (server.status === "deferred" && phone.status === "delivered") {
    return {
      conflict: true,
      why: serverChangedAfterPhoneLost ? "moved_before_delivery" : "moved_after_delivery",
    };
  }
  if (server.status === "delivered" && phone.status !== "delivered") {
    return { conflict: true, why: "server_says_delivered" };
  }
  return { conflict: false };
}
