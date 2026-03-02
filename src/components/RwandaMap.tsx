"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import type { DashboardResult } from "@/engine/computation";
import { RWANDA_DISTRICTS_GEOJSON_URL, RWANDA_CENTER, RWANDA_BOUNDS } from "@/data/districtCostBands";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";

type GeoProps = { shapeName?: string; shapename?: string; name?: string; ADMIN2?: string };
type GeoJSONFeature = GeoJSON.Feature<GeoJSON.Geometry, GeoProps>;
type GeoJSONCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, GeoProps>;

function getFeatureName(p: GeoProps | undefined): string {
  if (!p) return "";
  return (p.shapeName ?? p.shapename ?? p.ADMIN2 ?? p.name ?? "") as string;
}

interface RwandaMapProps {
  result: DashboardResult;
}

const LEVEL_COLOR: Record<string, string> = {
  strained: "#ef4444",
  stable: "#eab308",
  strong: "#22c55e",
};

function getColorForDistrict(
  districtName: string,
  result: DashboardResult
): string {
  const aff = result.districtAffordability.find(
    (a) => a.district.name.toLowerCase() === districtName.toLowerCase()
  );
  return aff ? LEVEL_COLOR[aff.level] : "#555";
}

function GeoLayer({
  result,
  geojson,
  t,
}: {
  result: DashboardResult;
  geojson: GeoJSONCollection;
  t: (key: import("@/i18n/translations").TranslationKey, params?: Record<string, string | number>) => string;
}) {
  const style = (feature: GeoJSONFeature | undefined) => {
    const name = feature ? getFeatureName(feature.properties) : "";
    const color = getColorForDistrict(name, result);
    return {
      fillColor: color,
      color: "rgba(255,255,255,0.4)",
      weight: 1,
      fillOpacity: 0.7,
    };
  };

  const onEachFeature = (feature: GeoJSONFeature, layer: L.Layer) => {
    const name = getFeatureName(feature.properties) || "Unknown";
    const aff = result.districtAffordability.find(
      (a) => a.district.name.toLowerCase() === name.toLowerCase()
    );
    const ratio = aff?.ratio ?? 0;
    const levelKey = aff?.level ?? "strained";
    const levelLabel = t(levelKey === "strong" ? "strong" : levelKey === "stable" ? "stable" : "strained");
    const popupContent = `In <strong>${name}</strong>, your income is <strong>${ratio.toFixed(2)}×</strong> the comfortable lifestyle threshold (${levelLabel}).`;
    (layer as L.Layer & { bindPopup: (c: string) => void }).bindPopup(popupContent);
  };

  return (
    <GeoJSON
      data={geojson}
      style={style}
      onEachFeature={onEachFeature}
    />
  );
}

function FitBounds({ geojson, useRwandaBounds }: { geojson: GeoJSONCollection; useRwandaBounds: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (useRwandaBounds) {
      map.fitBounds(L.latLngBounds(RWANDA_BOUNDS[0], RWANDA_BOUNDS[1]), { padding: [24, 24], maxZoom: 9 });
      return;
    }
    if (!geojson?.features?.length) return;
    const bounds = L.geoJSON(geojson as GeoJSON.GeoJsonObject).getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24] });
  }, [map, geojson, useRwandaBounds]);
  return null;
}

function RecenterButton({ geojson, label }: { geojson: GeoJSONCollection | null; label: string }) {
  const map = useMap();

  useEffect(() => {
    if (!geojson?.features?.length) return;

    const RecenterControl = L.Control.extend({
      onAdd: () => {
        const div = L.DomUtil.create("div", "leaflet-bar");
        div.style.background = "none";
        div.style.border = "none";
        const btn = L.DomUtil.create("button", "", div);
        btn.type = "button";
        btn.textContent = label;
        btn.className = "bg-white dark:bg-[#1e1e22] border border-gray-200 dark:border-white/20 rounded-lg shadow-md px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 cursor-pointer";
        btn.style.cursor = "pointer";
        L.DomEvent.disableClickPropagation(btn);
        L.DomEvent.on(btn, "click", () => {
          const bounds = L.geoJSON(geojson as GeoJSON.GeoJsonObject).getBounds();
          if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24] });
          else map.setView(RWANDA_CENTER, 8);
        });
        return div;
      },
    });
    const control = new RecenterControl({ position: "topright" });
    map.addControl(control);
    return () => {
      map.removeControl(control);
    };
  }, [map, geojson, label]);

  return null;
}

export function RwandaMap({ result }: RwandaMapProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [geojson, setGeojson] = useState<GeoJSONCollection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mapBg = theme === "dark" ? "#1a1a1e" : "#e5e7eb";

  useEffect(() => {
    fetch(RWANDA_DISTRICTS_GEOJSON_URL)
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then((data) => {
        if (data?.type === "FeatureCollection" && Array.isArray(data?.features)) {
          setGeojson(data);
        } else {
          setError("Invalid GeoJSON");
        }
      })
      .catch((e) => setError(e.message ?? "Failed to load map"));
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl bg-white dark:bg-[#1e1e22]/90 border border-gray-200 dark:border-white/10 p-6 flex items-center justify-center min-h-[280px] text-gray-500 dark:text-[#8a8a8f]">
        {t("mapLoadError")}
      </div>
    );
  }

  if (!geojson) {
    return (
      <div className="rounded-2xl bg-white dark:bg-[#1e1e22]/90 border border-gray-200 dark:border-white/10 p-6 flex items-center justify-center min-h-[280px] text-gray-500 dark:text-[#8a8a8f]">
        {t("mapLoading")}
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-[#1e1e22] w-full shadow-sm dark:shadow-none flex flex-col">
      <div className="relative w-full min-h-[320px] h-[380px] sm:h-[420px]">
        <MapContainer
          center={RWANDA_CENTER}
          zoom={8}
          style={{ height: "100%", width: "100%", background: mapBg }}
          zoomControl={true}
          className="rounded-2xl"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds geojson={geojson} useRwandaBounds={true} />
          <GeoLayer result={result} geojson={geojson} t={t} />
          <RecenterButton geojson={geojson} label={t("mapRecenter")} />
        </MapContainer>
      </div>
      <p className="text-xs sm:text-sm text-gray-500 dark:text-[#8a8a8f] px-4 py-2.5 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1e]">
        {t("mapCaption")}
      </p>
    </div>
  );
}
