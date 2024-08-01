import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

import "mapbox-gl/dist/mapbox-gl.css";
import "../index.css";
import { Modal, Avatar, Card, Flex, Timeline } from "antd";
import {
  EditOutlined,
  EllipsisOutlined,
  SettingOutlined,
} from "@ant-design/icons";

const { Meta } = Card;

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
  const [visible, setVisible] = useState(false);

  const showModal = () => {
    setVisible(true);
  };

  const handleCancel = () => {
    setVisible(false);
    setReload(!reload);
  };

  const travelSchedule = [
    {
      date: "2023-07-01",
      events: [
        { time: "9:00 AM", title: "Đến khách sạn và nhận phòng" },
        { time: "11:00 AM", title: "Tham quan Nhà thờ Đức Bà" },
        { time: "2:00 PM", title: "Ăn trưa tại nhà hàng địa phương" },
        { time: "4:00 PM", title: "Đi thuyền trên sông Seine" },
      ],
    },
    {
      date: "2023-07-02",
      events: [
        { time: "9:00 AM", title: "Tham quan Tháp Eiffel" },
        { time: "11:30 AM", title: "Ghé thăm Bảo tàng Louvre" },
        { time: "2:00 PM", title: "Ăn trưa tại quán café trên Champs-Élysées" },
        { time: "4:00 PM", title: "Đi dạo ở khu phố Montmartre" },
      ],
    },
  ];

  const goIds = getDataFromLocalStorage("goIds");
  const goingSoonIds = getDataFromLocalStorage("goingSoonIds");
  useEffect(() => {
    if (!goIds) {
      setDataToLocalStorage("goIds", [1]);
    }
    if (!goingSoonIds) {
      setDataToLocalStorage("goingSoonIds", [2]);
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

  function getFillColorExpression(goIds, goingSoonIds) {
    if (goIds.length > 0 && goingSoonIds.length > 0) {
      return [
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
      ];
    } else if (goIds.length > 0) {
      return [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        "#627BC1",
        ["match", ["id"], goIds, "#FFA500", "#627BC1"],
      ];
    } else if (goingSoonIds.length > 0) {
      return [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        "#627BC1",
        ["match", ["id"], goingSoonIds, "#ff0000", "#627BC1"],
      ];
    } else {
      return [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        "#627BC1",
        "#627BC1",
      ];
    }
  }

  const fillColorExpression = getFillColorExpression(goIds, goingSoonIds);

  useEffect(() => {
    if (!goIds || !goingSoonIds) return;
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
          "fill-color": fillColorExpression,
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
            .setHTML(`<div>${ten_tinh}</div>`)
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
    const id = feature.id;
    const goButtonText = goIds.includes(id) ? "Chưa đi!" : "Đã đi!";
    const goingSoonButtonText = goingSoonIds.includes(id)
      ? "Không đi!"
      : "Sắp đi!";
    const popupContent = `
    <div style="padding: 5px; border-radius:10px ">
      <h3 style="margin: 0; color: #484896;">${feature.properties.ten_tinh}</h3>
      <p><strong>Population:</strong> ${feature.properties.gid}</p>
      <button id="popup-button-1" style="margin-right: 5px;">${goButtonText}</button>
      <button id="popup-button-2">${goingSoonButtonText}</button>
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
      if (goIds.includes(id)) {
        showModal();
      } else {
        setReload(!reload);
      }
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
    <>
      <div className="main__map">
        <div className="box-setting">
          <button className="btn-setting" onClick={handleChangeStyle}>
            Setting Background
          </button>
        </div>
        <div id="map" style={{ height: "100%" }} />
      </div>

      <Flex align="start" justify="space-between" gap={30}>
        <Card
          style={{ width: 300 }}
          cover={
            <img
              alt="example"
              src="https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png"
            />
          }
          actions={[
            <SettingOutlined key="setting" />,
            <EditOutlined key="edit" />,
            <EllipsisOutlined key="ellipsis" />,
          ]}
        >
          <Meta
            avatar={
              <Avatar src="https://api.dicebear.com/7.x/miniavs/svg?seed=8" />
            }
            title="Tuấn Nguyễn"
          />
          <Flex align="center" justify="space-between">
            <div className="font-text">
              <h3>0</h3>
              <p>Quốc gia</p>
            </div>
            <div className="font-text">
              <h3>{goingSoonIds.length + goIds.length}</h3>
              <p>Thành phố</p>
            </div>
          </Flex>
          <Flex align="center" justify="space-between">
            <div className="font-text">
              <h3>0</h3>
              <p>Người theo dõi</p>
            </div>
            <div className="font-text">
              <h3>0</h3>
              <p>Đang theo dõi</p>
            </div>
          </Flex>
        </Card>
        <div className="box-content">
          <div className="header-box">My Travel Map</div>
          <div className="content">
            <p style={{ textAlign: "center" }}>
              <b>Tuấn Nguyễn</b> đã khám phá
            </p>
            <Flex align="center" justify="center">
              <div
                className="font-text"
                style={{ borderRight: "1px solid #CCCCCC" }}
              >
                <h2 style={{ color: "orange" }}>
                  {goingSoonIds.length + goIds.length}/63
                </h2>
                <p>Tỉnh thành</p>
              </div>
              <div className="font-text">
                <h2 style={{ color: "orange" }}>
                  {(((goingSoonIds.length + goIds.length) / 63) * 100).toFixed(
                    2
                  )}{" "}
                  %
                </h2>
                <p>Việt Nam</p>
              </div>
            </Flex>
          </div>
        </div>
      </Flex>

      <Modal
        title="Lịch Trình Du Lịch"
        open={visible}
        onCancel={handleCancel}
        footer={null}
      >
        <Timeline mode="left" style={{ flex: 1, paddingRight: "24px" }}>
          {travelSchedule.map((day, index) => (
            <Timeline.Item key={index} label={day.date}>
              {day.events.map((event, eventIndex) => (
                <p key={eventIndex}>
                  {event.time} - {event.title}
                </p>
              ))}
            </Timeline.Item>
          ))}
        </Timeline>
      </Modal>
    </>
  );
};

export default HoverMap;
