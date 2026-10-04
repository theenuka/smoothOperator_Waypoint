// Drives VEH022 along the A1 from Peliyagoda to Kandy so the live map moves during a demo.
// Usage: npm run sim            (API at http://localhost:4000)
//        API=https://your-url npm run sim
const API = (process.env.API || "http://localhost:4000").replace(/\/$/, "");
const VEHICLE = process.env.VEHICLE || "VEH022";
const STEP_MS = Number(process.env.STEP_MS || 3000);

// Waypoints on the A1 (lat, lng)
const ROUTE = [
  ["Peliyagoda depot", 6.9615, 79.8869],
  ["Kadawatha", 7.0016, 79.953],
  ["Nittambuwa", 7.144, 80.096],
  ["Warakapola", 7.227, 80.198],
  ["Kegalle", 7.2513, 80.3464],
  ["Kadugannawa", 7.255, 80.524],
  ["Peradeniya", 7.269, 80.596],
  ["Kandy City", 7.2906, 80.6337],
];
const PER_LEG = 6; // pings between two waypoints

const points = [];
for (let i = 0; i < ROUTE.length - 1; i++) {
  const [, aLat, aLng] = ROUTE[i];
  const [, bLat, bLng] = ROUTE[i + 1];
  for (let k = 0; k < PER_LEG; k++) {
    const t = k / PER_LEG;
    points.push([aLat + (bLat - aLat) * t, aLng + (bLng - aLng) * t, ROUTE[i + 1][0]]);
  }
}
points.push([ROUTE.at(-1)[1], ROUTE.at(-1)[2], ROUTE.at(-1)[0]]);

let n = 0;
async function tick() {
  const [lat, lng, towards] = points[n % points.length];
  try {
    const res = await fetch(`${API}/api/tracking/ping`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ vehicleId: VEHICLE, lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) }),
    });
    console.log(`${VEHICLE} ${lat.toFixed(4)}, ${lng.toFixed(4)} towards ${towards} (${res.status})`);
  } catch (e) {
    console.log(`API not reachable at ${API}: ${e.message}`);
  }
  n++;
}
console.log(`Simulating ${VEHICLE} on the A1 every ${STEP_MS / 1000}s against ${API}. Ctrl+C to stop.`);
tick();
setInterval(tick, STEP_MS);
