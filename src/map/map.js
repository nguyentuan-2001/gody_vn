import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

import "mapbox-gl/dist/mapbox-gl.css";
import "../index.css";
const roads = require("../data/diaphantinh.geojson");

const HoverMap = () => {
  const mapContainerRef = useRef();
  const mapRef = useRef();

  const mapstyle = "mapbox://styles/tuan2k1tv/clpw10vsk01i001p9gmiu52tp";
  const green = {
    version: 8,
    name: "Empty",
    metadata: {
      "mapbox:autocomposite": true,
    },
    glyphs:
      "https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=S1qTEATai9KydkenOF6W",
    sources: {},
    layers: [
      {
        id: "background",
        type: "background",
        paint: {
          "background-color": "#deeed2",
        },
      },
    ],
  };
  const [currentStyle, setCurrentStyle] = useState(mapstyle);
  const highlightedIds = [1, 2, 3];

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1IjoidHVhbjJrMXR2IiwiYSI6ImNsaWlkN3Z2dzF5MjEzZXBmNmNybzUwMTQifQ.1-igydy5eIwov_1pryiTVA";

    mapRef.current = new mapboxgl.Map({
      container: "map",
      style: currentStyle,
      center: [105.843484, 21.005532],
      zoom: 17,
      hash: "map",
    });

    let hoveredPolygonId = null;

    mapRef.current.on("load", () => {
      mapRef.current.addSource("states", {
        type: "geojson",
        data: roads,
      });

      // The feature-state dependent fill-opacity expression will render the hover effect
      // when a feature's hover state is set to true.
      mapRef.current.addLayer({
        id: "state-fills",
        type: "fill",
        source: "states",
        layout: {},
        paint: {
            "fill-color": "#627BC1",
          //   "fill-color": ["case", ["==", ["id"], 5], "#FFA500", "#627BC1"],
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            1,
            0.5,
          ],
        },
      });

      mapRef.current.addLayer({
        id: "state-borders",
        type: "line",
        source: "states",
        layout: {},
        paint: {
          "line-color": "#627BC1",
          "line-width": 2,
        },
      });

      mapRef.current.on("mousemove", "state-fills", (e) => {
        if (e.features.length > 0) {
          if (hoveredPolygonId !== null) {
            mapRef.current.setFeatureState(
              { source: "states", id: hoveredPolygonId },
              { hover: false }
            );
          }
          hoveredPolygonId = e.features[0].id;
          mapRef.current.setFeatureState(
            { source: "states", id: hoveredPolygonId },
            { hover: true }
          );
        }
      });

      mapRef.current.on("mouseleave", "state-fills", () => {
        if (hoveredPolygonId !== null) {
          mapRef.current.setFeatureState(
            { source: "states", id: hoveredPolygonId },
            { hover: false }
          );
        }
        hoveredPolygonId = null;
      });
    });

    mapRef.current.on("click", "state-fills", (e) => {
      createPopup(e.features[0], e.lngLat, mapRef.current);
    });

    mapRef.current.on("mouseenter", "state-fills", () => {
      mapRef.current.getCanvas().style.cursor = "pointer";
    });

    mapRef.current.on("mouseleave", "state-fills", () => {
      mapRef.current.getCanvas().style.cursor = "";
    });

    return () => mapRef.current.remove();
  }, [currentStyle]);

  const handleChangeStyle = () => {
    if (currentStyle !== mapstyle) {
      setCurrentStyle(mapstyle);
    } else {
      setCurrentStyle(green);
    }
  };

  const createPopup = (feature, lngLat, map) => {
    const popupContent = `
      <div style="padding: 5px; border-radius:10px ">
        <h3 style="margin: 0; color: #484896;">${feature.properties.ten_tinh}</h3>
        <p><strong>Population:</strong> ${feature.properties.gid}</p>
        <button id="popup-button-1" style="margin-right: 5px;">Go!</button>
        <button id="popup-button-2"> Going Soon!</button>
      </div>
    `;

    const popup = new mapboxgl.Popup()
      .setLngLat(lngLat)
      .setHTML(popupContent)
      .addTo(map);

    document.getElementById("popup-button-1")?.addEventListener("click", () => {
      console.log("Button 1 clicked!");
    });

    document.getElementById("popup-button-2")?.addEventListener("click", () => {
      console.log("Button 2 clicked!");
    });
  };

  return (
    <div className="main__map">
      <div className="box-setting">
        <button className="btn-setting" onClick={handleChangeStyle}>
          Setting Background
        </button>
      </div>
      <div id="map" style={{ height: "100%" }} />
    </div>
  );
};

export default HoverMap;
