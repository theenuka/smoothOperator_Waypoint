// Process one offline sync batch. Owner: BACKEND B.
// Pure function: the database work is passed in as `apply`, so this is easy to test
// (see server/test/syncBatch.test.js).
//
// Rules:
//   - Records are applied in the order the phone recorded them (oldest first).
//   - One bad record never stops the others. It comes back in `errors` and stays on the phone
//     (the outbox keeps anything that isn't accepted, duplicate or conflict), so nothing is lost.
//   - The same clientId twice in one batch is applied once; the second is a duplicate.

/**
 * @param {Array} records                 delivery records from the phone outbox
 * @param {(rec) => {status, conflict?}} apply   applies one record (applyDelivery in production)
 * @returns {{ accepted: string[], duplicates: string[], conflicts: object[], errors: {clientId, error}[] }}
 */
export function processBatch(records, apply) {
  const out = { accepted: [], duplicates: [], conflicts: [], errors: [] };
  const seen = new Set();
  const ordered = [...(records || [])].sort((a, b) =>
    String(a?.recordedAt || "").localeCompare(String(b?.recordedAt || ""))
  );
  for (const rec of ordered) {
    if (!rec || typeof rec !== "object") {
      out.errors.push({ clientId: null, error: "Record is not an object" });
      continue;
    }
    if (rec.clientId && seen.has(rec.clientId)) {
      out.duplicates.push(rec.clientId);
      continue;
    }
    if (rec.clientId) seen.add(rec.clientId);
    try {
      const result = apply(rec);
      if (result.status === "accepted") out.accepted.push(rec.clientId);
      else if (result.status === "duplicate") out.duplicates.push(rec.clientId);
      else out.conflicts.push(result.conflict);
    } catch (e) {
      out.errors.push({ clientId: rec.clientId ?? null, error: e.message || "Could not save this record" });
    }
  }
  return out;
}
