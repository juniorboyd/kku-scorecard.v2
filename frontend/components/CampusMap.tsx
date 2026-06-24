"use client";
import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SECURITY_MOCK_DATA } from "@/lib/mock-data";

// Fix for default Leaflet icon paths in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface CampusMapProps {
  orgScores: any[];
  onMarkerClick?: (faculty: any) => void;
}

export default function CampusMap({ orgScores, onMarkerClick }: CampusMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    if (!mapRef.current) {
      // Initialize map
      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([16.4743, 102.8230], 14.5);

      // Add CartoDB Voyager basemap
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      // Add zoom control
      L.control.zoom({ position: "bottomright" }).addTo(map);
      
      markersRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
    }

    const map = mapRef.current;
    const markersGroup = markersRef.current;

    if (markersGroup) {
      markersGroup.clearLayers();
      
      SECURITY_MOCK_DATA.faculties.forEach((faculty) => {
        if (!faculty.coords) return;
        
        // Find matching score from backend if available, otherwise use mock
        const backendOrg = orgScores.find(o => o.organization === faculty.name || o.organization === faculty.nameEn);
        const score = backendOrg ? backendOrg.securityScore : faculty.score;
        
        let colorClass = "bg-green-500";
        if (score < 60) colorClass = "bg-red-500";
        else if (score < 70) colorClass = "bg-orange-500";
        else if (score < 80) colorClass = "bg-yellow-500";
        
        const customIcon = L.divIcon({
          className: "custom-div-icon",
          html: `<div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${colorClass} text-white font-bold text-xs hover:scale-110 transition-transform cursor-pointer">${faculty.abbr}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        
        const marker = L.marker([faculty.coords[0], faculty.coords[1]], { icon: customIcon });
        
        marker.on("click", () => {
          if (onMarkerClick) onMarkerClick(faculty);
        });

        marker.addTo(markersGroup);
      });
    }
  }, [orgScores, onMarkerClick]);

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-slate-800 z-0">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
