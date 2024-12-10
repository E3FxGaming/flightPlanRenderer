'strict mode';

var map = L.map('map').setView([51.505, -0.09], 5);;

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 10,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const inputElement = document.getElementById('fileInput');
inputElement.addEventListener('change', uploadFile, false);
let currentLine = null;
let currentMarkers = [];
function uploadFile() {
    console.log('upload file');
    const file = this.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
        const result = (new DOMParser()).parseFromString(event.target.result, "application/xml");
        if(currentLine != null) {
            currentLine.remove();
        }
        currentMarkers.forEach(marker => marker.remove());
        currentMarkers = [];

        const waypoints = [];
        result.querySelectorAll('ATCWaypoint').forEach((waypoint) => {
            //route
            const content = waypoint.querySelector('WorldPosition').textContent
            console.log(content);
            function interpretCoordinate(coord) {
                const [degrees, minutes, seconds] = coord.match(/(\d+)° (\d+)' (\d+\.\d+)"/).slice(1).map(Number);
                const decimal = degrees + minutes / 60 + seconds / 3600;
                return coord.includes('S') || coord.includes('W') ? -decimal : decimal;
            }
            const segments = content.split(',')
            const [lat, lon] = segments.slice(0,2).map(interpretCoordinate);
            const altitude = Number(segments[2]);
            const result = [lat, lon, altitude]
            waypoints.push(result);

            //marker
            const markerContent = [];
            const icaoIdent = waypoint.querySelector('ICAOIdent')?.textContent;
            const runway = waypoint.querySelector('RunwayNumberFP')?.textContent;
            const runwayDesignator = waypoint.querySelector('RunwayDesignatorFP')?.textContent;
            if(icaoIdent != null) {
                markerContent.push(icaoIdent);
            }
            if(runway != null) {
                markerContent.push(runway);
            }
            if(runwayDesignator != null) {
                markerContent.push(runwayDesignator);
            }

            if(markerContent.length > 0 && runway != null) {
                const markerName = markerContent.join(' ');
                const marker = L.marker(result, { title: markerName}).addTo(map);
                currentMarkers.push(marker);
            }

        });
        console.log(waypoints);
        
        currentLine = L.polyline(waypoints, {color: 'red'}).addTo(map);
        map.fitBounds(currentLine.getBounds());
    };
    reader.readAsText(file);
}

