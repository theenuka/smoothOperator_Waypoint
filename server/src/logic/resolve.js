// What a sync decision changes. Pure function, tested in server/test/resolve.test.js.
//
// choice "server": the office version stands, nothing on the order changes.
// choice "phone":  the phone record is the truth.
//   - phone says delivered -> order and stop delivered, an office deferral is reversed
//   - phone says failed    -> stop failed, any office delivery is superseded, the store gets a notice;
//                             "return" sends the order back for re-planning, "retry" keeps it on the truck
export function resolution(conflict, choice) {
  if (choice !== "phone") return { apply: false };
  const status = conflict.phone?.status || "delivered";
  if (status === "failed") {
    return {
      apply: true,
      stopStatus: "failed",
      orderStatus: conflict.phone.goods === "return" ? "failed" : "loaded",
      reverseDeferral: false,
      supersedeOfficeDelivery: true,
      notice: true,
    };
  }
  return {
    apply: true,
    stopStatus: "delivered",
    orderStatus: "delivered",
    reverseDeferral: true,
    supersedeOfficeDelivery: false,
    notice: false,
  };
}
