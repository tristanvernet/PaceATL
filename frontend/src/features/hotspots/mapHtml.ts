// Uses the same Leaflet/OpenStreetMap setup as the existing PaceATL route map.
export const hotspotMapHtml = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>html,body,#map{height:100%;margin:0}</style></head><body><div id="map"></div><script>
const map=L.map('map').setView([33.749,-84.388],12);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
let markers=L.layerGroup().addTo(map);
function receive(message){if(!message||message.type!=='hotspots')return;markers.clearLayers();const bounds=[];for(const h of message.hotspots){if(!Number.isFinite(h.latitude)||!Number.isFinite(h.longitude))continue;const pos=[h.latitude,h.longitude];bounds.push(pos);L.circleMarker(pos,{radius:9,color:'#315e45',fillColor:'#315e45',fillOpacity:.8}).addTo(markers).on('click',()=>{const m={type:'select',id:h.id};if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(m));else window.parent.postMessage(m,'*')})}if(bounds.length)map.fitBounds(bounds,{padding:[32,32],maxZoom:14})}
window.addEventListener('message',event=>receive(event.data));window.receiveHotspots=receive;
</script></body></html>`;
