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
        let currentCircle = null;
        let currentPos = null;
        
        // React Native로부터 위치 정보를 수신하는 리스너
        window.addEventListener("message", (event) => {
          try {
            const {type, payload} = JSON.parse(event.data);

            if (type === 'UPDATE_LOCATION' && payload) {
              const { lat, lng } = payload;
              const currentPos = new window.kakao.maps.LatLng(lat, lng);

              // 지도를 현재 위치로 부드럽게 이동
              map.panTo(currentPos);

              // 마커가 없으면 새로 만들고, 있으면 위치만 업데이트
              if (!currentCircle) {
                currentCircle = new window.kakao.maps.Circle({
                  center: currentPos,
                  radius: 50,
                  strokeWeight: 3,
                  strokeColor: '#FF0000',
                  strokeOpacity: 0.8,
                  strokeStyle: 'solid',
                  fillColor: '#FF0000',
                  fillOpacity: 0.4
                });
                currentCircle.setMap(map);
               } else {
                currentCircle.setPosition(currentPos);
              }
            }
          } catch (error) {
            console.error("Failed to process message from React Native:", error);
          }
        });

        // "내 위치" 버튼 이벤트 핸들러
        const myLocationButton = document.getElementById("myLocationButton");

        if(myLocationButton) {
          myLocationButton.addEventListener("click", () => {
            if (currentPos) {
              map.panTo(currentPos);
            } 
          });
        }
        


        // 중앙에 위치할 마커 생성
        const marker = new window.kakao.maps.Marker({
          position: map.getCenter(),
          map: map,
        });

        // 지도의 중심이 변경될 때 마커 위치 업데이트
        window.kakao.maps.event.addListener(map, "center_changed", function () {
          marker.setPosition(map.getCenter());
        });

        // 지도 드래그가 끝나면 React Native로 좌표 전송
        window.kakao.maps.event.addListener(map, "dragend", function () {
          const center = map.getCenter();
          const message = {
            type: "map_center_changed",
            payload: {
              latitude: center.getLat(),
              longitude: center.getLng(),
            },
          };
          window.ReactNativeWebView?.postMessage(JSON.stringify(message));
        });

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
      });
    }
  }, []);

  return (
    <>
      <div id="map" style={{ width: "100%", height: "100%" }} />
    </>
  );
}
