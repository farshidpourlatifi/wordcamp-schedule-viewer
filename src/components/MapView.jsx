import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// Leaflet's default marker points at image files by relative URL, which a
// bundler rewrites and breaks — the classic "markers are invisible" bug. Wiring
// the imported asset URLs into the default icon once, at module load, fixes
// every marker without repeating the config per component.
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { formatCampDate } from "@/utils/formatDate";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/**
 * The map view: WordCamps as pins on a world map.
 *
 * The third way to read the same list. The calendar answers "when", the list
 * answers "what has there been", the map answers "where". It shares the
 * upcoming/past tabs with the list, so it receives one already-filtered side
 * at a time.
 *
 * Two things are driven by the real data. ~1,445 past camps is far too many
 * individual markers for Leaflet to place smoothly, so they are clustered —
 * pins merge into counted groups that split as you zoom. And ~4% of records
 * have no usable coordinates (virtual events, old records); those cannot sit
 * on a map, so they are counted in a note rather than silently missing.
 */

/** A neutral world view: the whole map visible, centred near the equator. */
const INITIAL_CENTER = [20, 0];
const INITIAL_ZOOM = 2;

/**
 * @param {Object} props
 * @param {Array} props.camps Normalized camps for one tab (upcoming or past).
 * @param {string} props.emptyMessage Shown when there are no camps at all.
 */
export function MapView({ camps, emptyMessage }) {
  const located = useMemo(
    () => camps.filter((camp) => camp.coordinates),
    [camps],
  );

  if (camps.length === 0) {
    return <p className="py-12 text-muted-foreground">{emptyMessage}</p>;
  }

  const unlocatedCount = camps.length - located.length;

  return (
    <div>
      <div className="h-[70vh] min-h-80 overflow-hidden rounded-lg border border-border">
        <MapContainer
          center={INITIAL_CENTER}
          zoom={INITIAL_ZOOM}
          scrollWheelZoom={false}
          worldCopyJump
          className="h-full w-full"
        >
          <TileLayer
            // OpenStreetMap's standard tiles — free, no key, attribution
            // required and provided below.
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MarkerClusterGroup chunkedLoading>
            {located.map((camp) => (
              <Marker
                key={camp.id}
                position={[camp.coordinates.lat, camp.coordinates.lng]}
              >
                <Popup>
                  <CampPopup camp={camp} />
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>

      {unlocatedCount > 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          {unlocatedCount} camp{unlocatedCount === 1 ? "" : "s"} with no mapped
          location {unlocatedCount === 1 ? "is" : "are"} not shown — see the List
          view.
        </p>
      )}
    </div>
  );
}

/**
 * The content of a marker's popup.
 *
 * Deliberately plain: a title that links to the event (with the same
 * noopener/noreferrer as every external link in the app), the date, and the
 * location line. The popup is Leaflet-rendered outside the Tailwind base
 * layer, so the link colour is set inline rather than via a token class.
 *
 * @param {Object} props
 * @param {Object} props.camp Normalized camp with coordinates.
 */
function CampPopup({ camp }) {
  return (
    <div className="text-sm">
      <p className="font-semibold">
        {camp.url ? (
          <a
            href={camp.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--primary)" }}
          >
            {camp.title}
          </a>
        ) : (
          camp.title
        )}
      </p>
      <p className="mt-1">{formatCampDate(camp.startDate)}</p>
      {camp.location && <p className="text-muted-foreground">{camp.location}</p>}
    </div>
  );
}
