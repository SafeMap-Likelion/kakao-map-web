import { useEffect } from "react";

export default function KakaoMap() {
  useEffect(() => {
    // 이미 로드되어 있으면 중복 로드 방지
    if (window.kakao?.maps) {
      init();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_APP_KEY}&autoload=false`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => init();

    function init() {
      window.kakao.maps.load(() => {
        const container = document.getElementById("map");
        if (!container) return;

        const options = {
          center: new window.kakao.maps.LatLng(37.5665, 126.978),
          level: 3,
        };

        const map = new window.kakao.maps.Map(container, options);

        // 전역 노출 (개발/디버그 용)
        //배포 시: map은 전역에서 제외하고 window.__kakaoBridge만 노출하기
        window.__map = map;

        //RN에서 쓰기 쉽게 가공한 카카오맵 sdk 주요 라이브러리
        window.__kakaoBridge__ = {
          panTo(lat, lng) {
            map.panTo(new window.kakao.maps.LatLng(lat, lng));
            return true;
          },
          addMarker(lat, lng) {
            const pos = new window.kakao.maps.LatLng(lat, lng);
            new window.kakao.maps.Marker({ position: pos }).setMap(map);
            return true;
          },
        };

        //디버그1
        window.ReactNativeWebView?.postMessage(
          JSON.stringify({
            type: "ready",
            payload: {
              center: {
                lat: map.getCenter().getLat(),
                lng: map.getCenter().getLng(),
                hasBridge: !!window.__kakaoBridge__,
              },
            },
          })
        );

        //디버그-2
        window.kakao.maps.event.addListener(map, "click", (e) => {
          const lat = e.latLng.getLat();
          const lng = e.latLng.getLng();
          window.ReactNativeWebView?.postMessage(
            JSON.stringify({ type: "map_click", payload: { lat, lng } })
          );
        });

        // 리스너가 바인딩된 시점도 RN에 알림
        window.ReactNativeWebView?.postMessage(
          JSON.stringify({ type: "listener_bound" })
        );

        // sdk로딩과 맵 생성 확인을 위한 기본 마커
        new window.kakao.maps.Marker({
          map,
          position: new window.kakao.maps.LatLng(37.5665, 126.978),
        });
      });
    }
  }, []);

  return <div id="map" style={{ width: "100%", height: "100vh" }} />;
}
