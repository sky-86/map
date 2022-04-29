function initMap(pos) {
  //api token
  mapboxgl.accessToken =
    'pk.eyJ1Ijoic2t5LTg2IiwiYSI6ImNsMmo3bnI5dzAyNjUzZHF5NWtqMGx6ZzAifQ.z41BKpPtsJ98GlLb7XjLqQ';

  console.log(pos);
  // create map object
  const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v11', // style URL
    center: [pos.lng, pos.lat], // starting position
    zoom: 13, // starting zoom
  });

  // add search bar
  const geocoder = new MapboxGeocoder({
    // Initialize the geocoder
    accessToken: mapboxgl.accessToken, // Set the access token
    mapboxgl: mapboxgl, // Set the mapbox-gl instance
    marker: false, // Do not use the default marker style
    bbox: [pos.lng - 0.1, pos.lat - 0.1, pos.lng + 0.1, pos.lat + 0.1],
    proximity: {
      longitude: pos.lng,
      latitude: pos.lat,
    },
  });
  map.addControl(geocoder);

  // Add zoom and rotation controls to the map.
  map.addControl(new mapboxgl.NavigationControl());

  const draw = new MapboxDraw({
    displayControlsDefault: false,
    // Select which mapbox-gl-draw control buttons to add to the map.
    controls: {
      polygon: true,
      trash: true,
    },
    // Set mapbox-gl-draw to draw by default.
    // The user does not have to click the polygon control button first.
    defaultMode: 'draw_polygon',
  });
  map.addControl(draw);

  map.on('draw.create', updateArea);
  map.on('draw.delete', updateArea);
  map.on('draw.update', updateArea);

  function updateArea(e) {
    const data = draw.getAll();

    if (data.features.length > 0) {
      var bbox = turf.bbox(data);
      var center = turf.center(data);
      console.log(bbox);

      geocoder.bbox = bbox;
      geocoder.proximity = center;
    }
  }

  // places marker on the place the user clicks from search
  clickedPlaceFromSearch(map, geocoder);
}

function getLocation() {
  let pos = { lat: 0, lng: 0 };
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      pos.lat = position.coords.latitude;
      pos.lng = position.coords.longitude;
      initMap(pos);
    });
  } else {
    print('error');
  }
}

function clickedPlaceFromSearch(map, geocoder) {
  // After the map style has loaded on the page,
  // add a source layer and default styling for a single point
  map.on('load', () => {
    map.addSource('single-point', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });

    map.addLayer({
      id: 'point',
      source: 'single-point',
      type: 'circle',
      paint: {
        'circle-radius': 10,
        'circle-color': '#448ee4',
      },
    });

    // Listen for the `result` event from the Geocoder
    // `result` event is triggered when a user makes a selection
    //  Add a marker at the result's coordinates
    geocoder.on('result', (event) => {
      map.getSource('single-point').setData(event.result.geometry);
    });
  });
}

getLocation();
