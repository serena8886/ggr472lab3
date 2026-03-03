/* ──────────────────────────────────────────
   GGR472 Lab 3 – Toronto DineSafe Map
   map.js: Mapbox initialisation, expressions, and events
────────────────────────────────────────── */
mapboxgl.accessToken = 'pk.eyJ1Ijoic2VyZW5heGllIiwiYSI6ImNta2RnM29ocjBiYmQzZnB3ZjYxNnc0Y2YifQ.OKLpStuEaqsA1l9cHya4Hw';
/* ──────────────────────────────────────────
   Sample DineSafe GeoJSON data
   (30 restaurants across Toronto)
   In a real project, load the full dataset
   from https://open.toronto.ca/dataset/dinesafe/
────────────────────────────────────────── */
map.addSource('restaurants', {
  type: 'geojson',
  data: 'https://raw.githubusercontent.com/serena8886/ggr472lab3/refs/heads/main/restaurant.geojson'
});

/* ──────────────────────────────────────────
   Helper: map status → CSS badge class
────────────────────────────────────────── */
const statusBadge = {
  'Pass':             'badge-pass',
  'Conditional Pass': 'badge-cond',
  'Closed':           'badge-closed'
};

const statusColor = {
  'Pass':             '#4caf50',
  'Conditional Pass': '#ff9800',
  'Closed':           '#ef5350'
};

/* ──────────────────────────────────────────
   Initialise map
────────────────────────────────────────── */
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [-79.3832, 43.6532],
  zoom: 12
});

// Navigation control (zoom +/- buttons)
map.addControl(new mapboxgl.NavigationControl(), 'top-right');

/* ──────────────────────────────────────────
   map.on('load') – add source + layer after
   the base style has finished loading
────────────────────────────────────────── */
map.on('load', () => {

  // ── Add GeoJSON source ──
  map.addSource('restaurants', {
    type: 'geojson',
    data: dinesafeData
  });

  // ── Add circle layer ──
  map.addLayer({
    id: 'restaurants-layer',
    type: 'circle',
    source: 'restaurants',
    paint: {
      /*
        DATA EXPRESSION: 'match' selects a colour based on the
        'status' property of each feature (conditional expression).
      */
      'circle-color': [
        'match', ['get', 'status'],
        'Pass',             '#4caf50',
        'Conditional Pass', '#ff9800',
        'Closed',           '#ef5350',
        '#aaa' // fallback
      ],

      /*
        CAMERA EXPRESSION: 'interpolate' smoothly scales circle
        radius as the user zooms in/out (ramp/scale expression).
      */
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        10, 4,   // at zoom 10 → radius 4px
        14, 9,   // at zoom 14 → radius 9px
        17, 14   // at zoom 17 → radius 14px
      ],

      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#fff',
      'circle-opacity': 0.9
    }
  });

  /* ──────────────────────────────────────
     EVENT: click → show Popup
  ────────────────────────────────────── */
  const popup = new mapboxgl.Popup({ closeButton: true, closeOnClick: true });

  map.on('click', 'restaurants-layer', (e) => {
    const p = e.features[0].properties;
    const badgeClass = statusBadge[p.status] || 'badge-pass';

    popup
      .setLngLat(e.lngLat)
      .setHTML(`
        <strong>${p.name}</strong>
        ${p.address}<br>
        <span class="status-badge ${badgeClass}">${p.status}</span><br>
        <span style="color:#aaa;font-size:11px;">Infraction: ${p.infraction}</span><br>
        <span style="color:#aaa;font-size:11px;">Inspected: ${p.date}</span>
      `)
      .addTo(map);
  });

  /* ──────────────────────────────────────
     EVENT: mouseenter / mouseleave →
     change cursor style
  ────────────────────────────────────── */
  map.on('mouseenter', 'restaurants-layer', () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'restaurants-layer', () => {
    map.getCanvas().style.cursor = '';
  });

  /* ──────────────────────────────────────
     EVENT: mousemove → update sidebar
     info box with hovered feature details
  ────────────────────────────────────── */
  map.on('mousemove', 'restaurants-layer', (e) => {
    const p = e.features[0].properties;
    document.getElementById('info').innerHTML = `
      <strong>${p.name}</strong>
      ${p.address}<br>
      Status: <b style="color:${statusColor[p.status]}">${p.status}</b><br>
      Inspected: ${p.date}
    `;
  });

  map.on('mouseleave', 'restaurants-layer', () => {
    document.getElementById('info').textContent = 'Hover over a restaurant to see details.';
  });

}); // end map.on('load')

/* ──────────────────────────────────────────
   FILTER BUTTONS
   Each button applies a filter expression
   to the layer, showing only features
   where 'status' matches the selection.
────────────────────────────────────────── */

// Track which filter is currently active
let activeFilter = 'all';

function setFilter(status) {
  activeFilter = status;

  /*
    FILTER EXPRESSION: setFilter applies a Mapbox expression
    to control which features are rendered.
    null removes the filter entirely (show all).
  */
  if (status === 'all') {
    map.setFilter('restaurants-layer', null);
  } else {
    map.setFilter('restaurants-layer', ['==', ['get', 'status'], status]);
  }

  // Update button visual state (dim all, then un-dim active one)
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.add('inactive'));

  const idMap = {
    'all':              'btn-all',
    'Pass':             'btn-pass',
    'Conditional Pass': 'btn-cond',
    'Closed':           'btn-closed'
  };
  document.getElementById(idMap[status]).classList.remove('inactive');
}

// Attach click listeners to each button
document.getElementById('btn-all')   .addEventListener('click', () => setFilter('all'));
document.getElementById('btn-pass')  .addEventListener('click', () => setFilter('Pass'));
document.getElementById('btn-cond')  .addEventListener('click', () => setFilter('Conditional Pass'));
document.getElementById('btn-closed').addEventListener('click', () => setFilter('Closed'));
