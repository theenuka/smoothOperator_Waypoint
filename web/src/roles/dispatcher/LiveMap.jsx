import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { time } from "../../shared/format.js";

// Known depot coordinates in Sri Lanka
const DEPOTS = {
  PLG: { id: "PLG", name: "Peliyagoda depot", sub: "PLG Main Depot", lat: 6.9615, lng: 79.8869 },
  KDY: { id: "KDY", name: "Kandy depot", sub: "Central Depot", lat: 7.2906, lng: 80.6337 },
};

export default function LiveMap({ trucks = [], selectedTruckId, selectedRun, onSelectVehicle }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({
    depots: L.layerGroup(),
    stops: L.layerGroup(),
    routes: L.layerGroup(),
    vehicles: L.layerGroup(),
  });
  const vehicleMarkersRef = useRef(new Map());
  const initialFitDoneRef = useRef(false);

  const selectedTruck = trucks.find((t) => t.vehicleId === selectedTruckId) || trucks[0];

  // 1. Initialize Map instance once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered on Sri Lanka Western - Central corridor
    const map = L.map(mapContainerRef.current, {
      center: [7.15, 80.2],
      zoom: 10,
      zoomControl: true,
      attributionControl: true,
    });

    // Standard OpenStreetMap tiles: 100% free, open source, no API key required
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add layer groups
    layersRef.current.depots.addTo(map);
    layersRef.current.routes.addTo(map);
    layersRef.current.stops.addTo(map);
    layersRef.current.vehicles.addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render Depots
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const group = layersRef.current.depots;
    group.clearLayers();

    // Show Peliyagoda depot and, if selected run is Kandy, also Kandy depot
    const depotsToShow = [DEPOTS.PLG];
    if (selectedTruckId === "VEH022" || selectedRun?.vehicleId === "VEH022") {
      depotsToShow.push(DEPOTS.KDY);
    }

    depotsToShow.forEach((depot) => {
      const isDestination = depot.id === "KDY";
      const icon = L.divIcon({
        className: "wp-map-depot-marker-wrap",
        html: `
          <div class="wp-map-depot-marker ${isDestination ? "dest" : "origin"}">
            <span class="wp-map-depot-sq"></span>
            <div class="wp-map-depot-label">
              <b>${depot.name}</b>
              <small>${depot.sub}</small>
            </div>
          </div>
        `,
        iconSize: [120, 36],
        iconAnchor: [8, 10],
      });

      L.marker([depot.lat, depot.lng], { icon, zIndexOffset: 200 })
        .addTo(group)
        .bindTooltip(`<b>${depot.name}</b><br/>${depot.sub}`, { direction: "top" });
    });
  }, [selectedTruckId, selectedRun]);

  // 3. Render Stops and Route Lines for selected Run
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const stopsGroup = layersRef.current.stops;
    const routesGroup = layersRef.current.routes;
    stopsGroup.clearLayers();
    routesGroup.clearLayers();

    const stops = selectedTruck?.stops || [];
    const validStopCoords = [];

    // Collect depot origin
    const origin = DEPOTS.PLG;
    validStopCoords.push([origin.lat, origin.lng]);

    // Plot stops
    stops.forEach((s) => {
      const lat = s.outlet?.lat;
      const lng = s.outlet?.lng;
      if (typeof lat !== "number" || typeof lng !== "number") return;

      validStopCoords.push([lat, lng]);

      const isDelivered = s.status === "delivered";
      const isNext = s.status === "next";

      const iconClass = isDelivered ? "delivered" : isNext ? "next" : "pending";
      const icon = L.divIcon({
        className: "wp-map-stop-wrap",
        html: `
          <div class="wp-map-stop-pin ${iconClass}">
            <span class="wp-map-stop-seq">${s.seq}</span>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([lat, lng], { icon, zIndexOffset: 150 }).addTo(stopsGroup);

      marker.bindPopup(`
        <div style="font-family: var(--f-ui); padding: 4px;">
          <div style="font-size: 13px; font-weight: 700; color: #1b1a17;">
            #${s.seq} ${s.outletName || s.outlet?.name}
          </div>
          <div style="font-size: 11px; color: #56534b; margin-top: 3px;">
            ETA: <b>${s.eta}</b> · Order ${s.orderId}
          </div>
          <div style="margin-top: 6px;">
            <span class="badge ${isDelivered ? "ok" : isNext ? "now" : ""}">
              ${isDelivered ? "✔ Delivered" : isNext ? "● Next stop" : "Pending"}
            </span>
          </div>
        </div>
      `);
    });

    // If destination is Kandy, append Kandy depot to route
    if (selectedTruckId === "VEH022") {
      validStopCoords.push([DEPOTS.KDY.lat, DEPOTS.KDY.lng]);
    }

    // Split completed vs upcoming route segments
    if (validStopCoords.length > 1) {
      // Find index of current progress
      const deliveredStops = stops.filter((s) => s.status === "delivered");
      const completedCount = deliveredStops.length;

      // Slice route up to current truck position or last delivered stop
      const completedPath = validStopCoords.slice(0, completedCount + 1);
      if (selectedTruck?.lat && selectedTruck?.lng) {
        completedPath.push([selectedTruck.lat, selectedTruck.lng]);
      }

      const remainingPath = [];
      if (selectedTruck?.lat && selectedTruck?.lng) {
        remainingPath.push([selectedTruck.lat, selectedTruck.lng]);
      }
      remainingPath.push(...validStopCoords.slice(completedCount + 1));

      // Draw completed route (solid dark ink)
      if (completedPath.length > 1) {
        L.polyline(completedPath, {
          color: "#1b1a17",
          weight: 3.5,
          opacity: 0.9,
          lineJoin: "round",
        }).addTo(routesGroup);
      }

      // Draw remaining route (dashed line)
      if (remainingPath.length > 1) {
        L.polyline(remainingPath, {
          color: "#56534b",
          weight: 2.5,
          dashArray: "6, 6",
          opacity: 0.7,
        }).addTo(routesGroup);
      }
    }
  }, [selectedTruck, selectedTruckId]);

  // 4. Render Live Vehicle Markers (updated smoothly without redrawing map)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const vehiclesGroup = layersRef.current.vehicles;
    const existingMarkers = vehicleMarkersRef.current;
    const activeIds = new Set();

    trucks.forEach((t) => {
      if (typeof t.lat !== "number" || typeof t.lng !== "number") return;
      activeIds.add(t.vehicleId);

      const isSelected = t.vehicleId === selectedTruckId;
      const isOffline = t.isOffline;

      const markerHtml = `
        <div class="wp-map-vehicle-marker ${isOffline ? "offline" : "online"} ${isSelected ? "selected" : ""}">
          <div class="wp-map-vehicle-pulse"></div>
          <div class="wp-map-vehicle-dot"></div>
          <div class="wp-map-vehicle-tag">
            <span class="mono">${t.vehicleId}</span>
            <span class="status-indicator">${isOffline ? "no signal" : "online"}</span>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: "wp-map-vehicle-wrap",
        html: markerHtml,
        iconSize: [110, 36],
        iconAnchor: [12, 12],
      });

      let marker = existingMarkers.get(t.vehicleId);
      if (marker) {
        // Smoothly update position & icon
        marker.setLatLng([t.lat, t.lng]);
        marker.setIcon(icon);
        marker.setZIndexOffset(isSelected ? 500 : 300);
      } else {
        marker = L.marker([t.lat, t.lng], { icon, zIndexOffset: isSelected ? 500 : 300 })
          .addTo(vehiclesGroup)
          .on("click", () => {
            if (onSelectVehicle) onSelectVehicle(t.vehicleId);
          });
        existingMarkers.set(t.vehicleId, marker);
      }

      // Offline warning popup / tooltip
      if (isOffline) {
        marker.bindPopup(`
          <div style="font-family: var(--f-ui); padding: 4px; max-width: 200px;">
            <div style="color: var(--red-text); font-weight: 700; font-size: 13px;">
              ⚠ No signal (${t.vehicleId})
            </div>
            <div style="font-size: 11.5px; color: #56534b; margin: 4px 0;">
              Last seen: <b>${t.at ? time(t.at) : "recently"}</b><br/>
              Location: <b>${t.place || "En route"}</b>
            </div>
            <div style="font-size: 11px; color: #6b675e; border-top: 1px solid #e5e0d8; padding-top: 4px;">
              Deliveries saved securely on driver's phone.
            </div>
          </div>
        `);
      } else {
        marker.bindTooltip(
          `<b>${t.vehicleId}</b> · ${t.route}<br/><span style="color:#2f7a4a;">Online · Tracking</span>`,
          { direction: "top" }
        );
      }
    });

    // Cleanup markers for vehicles no longer in list
    existingMarkers.forEach((marker, id) => {
      if (!activeIds.has(id)) {
        vehiclesGroup.removeLayer(marker);
        existingMarkers.delete(id);
      }
    });
  }, [trucks, selectedTruckId, onSelectVehicle]);

  // 5. Fit bounds on initial load or vehicle switch
  const fitToActiveRun = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const points = [];
    if (selectedTruck?.lat && selectedTruck?.lng) {
      points.push([selectedTruck.lat, selectedTruck.lng]);
    }
    (selectedTruck?.stops || []).forEach((s) => {
      if (s.outlet?.lat && s.outlet?.lng) {
        points.push([s.outlet.lat, s.outlet.lng]);
      }
    });
    // Add Peliyagoda depot
    points.push([DEPOTS.PLG.lat, DEPOTS.PLG.lng]);
    if (selectedTruckId === "VEH022") {
      points.push([DEPOTS.KDY.lat, DEPOTS.KDY.lng]);
    }

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  };

  useEffect(() => {
    if (!initialFitDoneRef.current && selectedTruck) {
      fitToActiveRun();
      initialFitDoneRef.current = true;
    }
  }, [selectedTruck]);

  return (
    <div className="dp5-map-container-relative">
      <div ref={mapContainerRef} className="dp5-leaflet-map" />

      {/* Map Control overlay: Recenter */}
      <div className="dp5-map-overlay-controls">
        <button
          type="button"
          className="dp-chip"
          style={{ background: "#ffffff", boxShadow: "0 2px 6px rgba(0,0,0,0.15)", cursor: "pointer" }}
          onClick={fitToActiveRun}
          title="Fit view to route"
        >
          ⤢ Fit route
        </button>
      </div>
    </div>
  );
}
