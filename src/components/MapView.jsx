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

import { useDarkTheme } from "@/hooks/useDarkTheme";
import { formatCampDate } from "@/utils/formatDate";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// OpenStreetMap's own tiles are light-only. CARTO's basemaps ship a matched
// light/dark pair (Positron / Dark Matter) — free, no key — so the map can
// follow the app's theme instead of glaring white over a dark page.
const TILES = {
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
};

const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

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

/**
 * Zoom 2 fits the whole world in a full-width frame, and it is also the floor:
 * zooming out further only adds grey margins and repeated worlds, so the map
 * opens at its minimum and can only zoom in from there.
 */
const MIN_ZOOM = 2;
const INITIAL_ZOOM = MIN_ZOOM;

/**
 * The one world, clamped to the Mercator latitude limit (~85°). With
 * `maxBoundsViscosity` at 1 the edge is solid, so panning cannot drift off the
 * map into empty space.
 */
const WORLD_BOUNDS = [
  [-85, -180],
  [85, 180],
];

/**
 * @param {Object} props
 * @param {Array} props.camps Normalized camps for one tab (upcoming or past).
 * @param {string} props.emptyMessage Shown when there are no camps at all.
 */
export function MapView({ camps, emptyMessage }) {
  const isDark = useDarkTheme();

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
          minZoom={MIN_ZOOM}
          maxBounds={WORLD_BOUNDS}
          maxBoundsViscosity={1}
          // The map is a dedicated full-width view, not a small embed, so plain
          // scroll-to-zoom is the expected gesture — there is little page to
          // trap the scroll against.
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            // Keyed on the theme so it remounts with fresh tiles when the theme
            // toggles, rather than leaving stale ones on screen.
            key={isDark ? "dark" : "light"}
            attribution={TILE_ATTRIBUTION}
            url={isDark ? TILES.dark : TILES.light}
            // One world only — no horizontal repetition past the bounds.
            noWrap
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
