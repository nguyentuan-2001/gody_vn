import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

import "mapbox-gl/dist/mapbox-gl.css";
import "../index.css";
const roads = require("../data/diaphantinh.geojson");

function setDataToLocalStorage(key, obj) {
  localStorage.setItem(key, JSON.stringify(obj));
}

function getDataFromLocalStorage(key) {
  const objString = localStorage.getItem(key);
  return objString ? JSON.parse(objString) : null;
}
const HoverMap = () => {
  const mapContainerRef = useRef();
  const mapRef = useRef();

  const goIds = getDataFromLocalStorage("goIds");
  const goingSoonIds = getDataFromLocalStorage("goingSoonIds");
  useEffect(() => {
    if (!goIds) {
      setDataToLocalStorage("goIds", []);
    }
    if (!goingSoonIds) {
      setDataToLocalStorage("goingSoonIds", []);
    }
  }, []);

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
  const [reload, setReload] = useState(true);

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1IjoidHVhbjJrMXR2IiwiYSI6ImNsaWlkN3Z2dzF5MjEzZXBmNmNybzUwMTQifQ.1-igydy5eIwov_1pryiTVA";

    mapRef.current = new mapboxgl.Map({
      container: "map",
      style: currentStyle,
      center: [105.843484, 21.005532],
      zoom: 4.5,
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
          "fill-color": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            "#627BC1",
            [
              "match",
              ["id"],
              goIds,
              "#FFA500",
              ["match", ["id"], goingSoonIds, "#ff0000", "#627BC1"],
            ],
          ],
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

      const popupName = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
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

          const feature = e.features[0];
          const { ten_tinh } = feature.properties;

          // Update and show the popup
          popupName
            .setLngLat(e.lngLat)
            .setHTML(`<h3>${ten_tinh}</h3>`)
            .addTo(mapRef.current);
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
        popupName.remove();
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
  }, [currentStyle, reload]);

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
        <button id="popup-button-1" style="margin-right: 5px;">Đã đi!</button>
        <button id="popup-button-2">Sắp đi!</button>
      </div>
    `;

    const popup = new mapboxgl.Popup()
      .setLngLat(lngLat)
      .setHTML(popupContent)
      .addTo(map);

    document.getElementById("popup-button-1")?.addEventListener("click", () => {
      const { id } = feature;

      // Remove the id from the goingSoonIds array if it exists there
      const goingSoonIndex = goingSoonIds.indexOf(id);
      if (goingSoonIndex !== -1) {
        goingSoonIds.splice(goingSoonIndex, 1);
      }

      // Toggle the id in the goIds array
      const goIndex = goIds.indexOf(id);
      if (goIndex !== -1) {
        goIds.splice(goIndex, 1);
      } else {
        goIds.push(id);
      }

      // Save the updated arrays to localStorage
      setDataToLocalStorage("goIds", goIds);
      setDataToLocalStorage("goingSoonIds", goingSoonIds);
      setReload(!reload);
    });

    document.getElementById("popup-button-2")?.addEventListener("click", () => {
      const { id } = feature;

      // Remove the id from the goIds array if it exists there
      const goIndex = goIds.indexOf(id);
      if (goIndex !== -1) {
        goIds.splice(goIndex, 1);
      }

      // Toggle the id in the goingSoonIds array
      const goingSoonIndex = goingSoonIds.indexOf(id);
      if (goingSoonIndex !== -1) {
        goingSoonIds.splice(goingSoonIndex, 1);
      } else {
        goingSoonIds.push(id);
      }

      // Save the updated arrays to localStorage
      setDataToLocalStorage("goIds", goIds);
      setDataToLocalStorage("goingSoonIds", goingSoonIds);
      setReload(!reload);
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
