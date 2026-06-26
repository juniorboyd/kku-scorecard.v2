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
        const cleanName = (name: string) => name.replace(/\s*มข\.?\s*/g, "").trim().toLowerCase();
        const backendOrg = orgScores.find(o => 
          cleanName(o.organization) === cleanName(faculty.name) || 
          cleanName(o.organization) === cleanName(faculty.nameEn)
        );
        const score = backendOrg ? backendOrg.securityScore : faculty.score;
        
        const borderClass = 
          score >= 90 ? "border-emerald-500 ring-emerald-500/20" :
          score >= 80 ? "border-green-400 ring-green-400/20" :
          score >= 70 ? "border-yellow-500 ring-yellow-500/20" :
          score >= 60 ? "border-orange-500 ring-orange-500/20" :
          "border-red-500 ring-red-500/20";
        
        const iconHtml = `<div class="w-10 h-10 rounded-full border-[3px] ${borderClass} bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform cursor-pointer ring-4">
               <span class="font-black text-slate-700 text-xs">${faculty.abbr}</span>
             </div>`;

        const customIcon = L.divIcon({
          className: "custom-div-icon",
          html: iconHtml,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });
        
        const marker = L.marker([faculty.coords[0], faculty.coords[1]], { icon: customIcon });
        
        const getGradeLabel = (s: number) => {
          if (s >= 90) return "A";
          if (s >= 80) return "B";
          if (s >= 70) return "C";
          if (s >= 60) return "D";
          return "F";
        };
        const grade = getGradeLabel(score);

        marker.on("click", () => {
          if (onMarkerClick) {
            onMarkerClick({
              ...faculty,
              id: backendOrg ? backendOrg.id : faculty.id,
              name: backendOrg ? backendOrg.organization : faculty.name,
              score,
              grade
            });
          }
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
