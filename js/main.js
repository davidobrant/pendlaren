const API_KEY = '3a24b219-d258-4485-971d-d979f6e01be1';

const positionButton = document.querySelector('#position-button')
const nearByStopsList = document.querySelector('[data-nearbystops-list]')
const stationContainer = document.querySelector('[data-station]')
const chosenStation = document.querySelector('[data-chosen-station]')
const stationSpan = document.querySelector('[data-station-span]')
const stationText = document.querySelector('[data-station-text]')
const departuresList = document.querySelector('[data-departures]')
const arrivalsList = document.querySelector('[data-arrivals]')
const travelsElement = document.querySelector('.travels')
const tableDiv = document.querySelector('[data-table]')
const tableButtonDiv = document.querySelector('[data-table-button]')

positionButton.onclick = async () => {
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            clearAll()
            showOnMap(position);
            const stops = await fetchNearByStops(position)
            stationSpan.innerText = '(välj hållplats)';
            if(!stops) return departuresList.innerText = 'Inga stop hittade...'
            stops.forEach(async (stop) => {
                showNearStops(stop)
            })
        })
    }
}

const clearAll = () => {
    nearByStopsList.innerHTML = '';
    departuresList.innerHTML = '';
    chosenStation.innerHTML = '';
    tableDiv.innerHTML = '';
    tableButtonDiv.innerHTML = '';
    tripList.innerHTML = '';
    stationSpan.innerHTML = '';
    cameraContainer.innerHTML = '';
}

const showNearStops = (stops) => {
    const li = document.createElement('li');
    li.innerText = stops.StopLocation.name;
    li.onclick = async () => chooseStation(stops.StopLocation)
    nearByStopsList.append(li)
}

const chooseStation = async (stopLocation) => {
    stationSpan.innerHTML = '';
    nearByStopsList.innerHTML = '';
    chosenStation.innerText = stopLocation.name;
    const travels = await fetchTravels(stopLocation.extId)
    if (!travels.departures.Departure) {
        departuresList.style.color = 'red'
        departuresList.innerText = 'Bara att snöra på promenadskorna ;)'
        return
    }
    const table = createTable()
    tableDiv.append(table)
    
    let amount = 5;
    showMoreResults(stopLocation, amount)
    
    const departures = travels.departures.Departure.slice(0, amount)
    departures.forEach(dep => {
        const results = showTravels(dep)
        table.append(results)
    })
}

const showMoreResults = async (stopLocation, amount) => {
    const button = document.createElement('button')
    button.innerText = 'visa fler...';
    button.onclick = async () => { 
        amount += 5; 
        tableDiv.innerHTML = '';
        const travels = await fetchTravels(stopLocation.extId)
        const table = createTable()
        tableDiv.append(table)
        const departures = travels.departures.Departure.slice(0, amount)
        departures.forEach(dep => {
            const results = showTravels(dep)
            table.append(results)
        })
    }
    tableButtonDiv.append(button)
}

const createTable = () => {
    const table = document.createElement('table')
    const tableRow = document.createElement('tr')
    const tableHeadLine = document.createElement('th')
    const tableHeadDirection = document.createElement('th')
    const tableHeadTrack = document.createElement('th')
    const tableHeadTime = document.createElement('th')
    tableHeadLine.innerText = 'Linje';
    tableHeadLine.classList.add('table-head-line');
    tableHeadDirection.innerText = 'Riktning';
    tableHeadDirection.classList.add('table-head-direction')
    tableHeadTrack.innerText = 'Läge';
    tableHeadTrack.classList.add('table-head-track')
    tableHeadTime.innerText = 'Avgång';
    tableHeadTime.classList.add('table-head-time')
    tableRow.append(tableHeadLine)
    tableRow.append(tableHeadDirection)
    tableRow.append(tableHeadTrack)
    tableRow.append(tableHeadTime)
    table.append(tableRow)
    return table
}

const showTravels = (dep) => {
    const row = document.createElement('tr')
    const line = document.createElement('td')
    const direction = document.createElement('td')
    const track = document.createElement('td')
    const time = document.createElement('td')
    line.innerText = dep.ProductAtStop.displayNumber;
    direction.innerText = dep.direction;
    track.innerText = dep.rtTrack;
    time.innerText = `${dep.time.slice(0,5)} `;
    row.onclick = () => {
        console.log('Clicked...')
        const now = new Date()
        console.log(parseInt(dep.time.slice(3,5)) - parseInt(now.getMinutes()))
    }
    row.append(line)
    row.append(direction)
    row.append(track)
    row.append(time)
    return row
}

const fetchTravels = async (stopId) => {
    const resDepartures = await fetch(`https://api.resrobot.se/v2.1/departureBoard?id=${stopId}&format=json&accessId=${API_KEY}`);
    const resArrivals = await fetch(`https://api.resrobot.se/v2.1/arrivalBoard?id=${stopId}&format=json&accessId=${API_KEY}`);
    const data = {
        departures: await resDepartures.json(),
        arrivals: await resArrivals.json()
    }
    return data
}

const fetchNearByStops = async (position) => {
    const API_URL = `https://api.resrobot.se/v2.1/location.nearbystops?format=json&accessId=${API_KEY}&originCoordLat=${position.coords.latitude}&originCoordLong=${position.coords.longitude}`
    const response = await fetch(API_URL)
    const data = await response.json();
    return data.stopLocationOrCoordLocation
}

/* ----- MAP ----- */
const API_TOKEN = 'pk.eyJ1Ijoiam9oYW5raXZpIiwiYSI6ImNrcnl6M25xMDA4aWUyd3BqY3EzYnA1NTEifQ.ve5rEn8ZDwUGKvphMkEdpw';

function showOnMap(position) {
    mapboxgl.accessToken = API_TOKEN;
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [position.coords.longitude, position.coords.latitude],
        zoom: 13
    });

    new mapboxgl.Marker().
    setLngLat([position.coords.longitude, position.coords.latitude]).
    addTo(map);
}


/* ----- Search ----- */

const searchButton = document.querySelector('[data-search-button]')
const searchFrom = document.querySelector('[data-search-from]')
const searchTo = document.querySelector('[data-search-to]')
const travelFromOptionsList = document.querySelector('[data-travel-from-options]')
const travelToOptionsList = document.querySelector('[data-travel-to-options]')
const tripList = document.querySelector('[data-trip-list]')

let searchFromItem = '';
let searchToItem = '';

searchButton.onclick = async () => {
    if (!searchFromItem) return
    if (!searchToItem) return
    clearAll()
    const trip = await searchTripFromAndTo(searchFromItem.extId, searchToItem.extId)
    trip.Trip.forEach((trip, index) => {
        // console.log(trip)
        const tripUl = document.createElement('ul')
        const tripSpan = document.createElement('span')
        tripSpan.innerText = `Resalternativ ${index + 1}`
        tripUl.append(tripSpan)
        
        const table = createAnotherTable()

        trip.LegList.Leg.forEach(stop => {
            const newRow = document.createElement('tr')
            const cellFrom = document.createElement('td')
            const cellTo = document.createElement('td')
            const cellLine = document.createElement('td')
            const cellTime = document.createElement('td')
            cellFrom.innerText = stop.Origin.name
            cellTo.innerText = stop.Destination.name
            cellLine.innerText = stop.Product[0].name
            cellTime.innerText = stop.Origin.time.slice(0,5)
            // console.log(stop.Product[0].name)
            // console.log(stop)
            // const li = document.createElement('li')
            // li.innerText = stop.Product[0].name
            // tripUl.append(li)
            newRow.append(cellFrom)
            newRow.append(cellTo)
            newRow.append(cellLine)
            newRow.append(cellTime)
            table.append(newRow)
        })
        
        tripUl.append(table)

        tripList.append(tripUl)
    })

}

const createAnotherTable = () => {
    const table = document.createElement('table')
    const tRow = document.createElement('tr')
    const tHeadFrom = document.createElement('th')
    const tHeadTo = document.createElement('th')
    const tHeadLine = document.createElement('th')
    const tHeadTime = document.createElement('th')
    
    tHeadFrom.innerText = 'Från'
    tHeadTo.innerText = 'Till'
    tHeadLine.innerText = 'Linje'
    tHeadTime.innerText = 'Avgång'
   
    tRow.append(tHeadFrom)
    tRow.append(tHeadTo)
    tRow.append(tHeadLine)
    tRow.append(tHeadTime)

    table.append(tRow)
    
    return table
}

searchFrom.oninput = async () => {
    const alternatives = await searchStop(searchFrom.value)
    const topAlternatives = alternatives.slice(0,5)

    travelFromOptionsList.innerHTML = '';
    topAlternatives.forEach(stop => {
        showFromAlternatives(stop)
    })
}

const showFromAlternatives = (stop) => {
    const li = document.createElement('li')
    li.innerText = stop.StopLocation.name
    li.onclick = () => {
        searchFromItem = stop.StopLocation
        searchFrom.value = stop.StopLocation.name;
        travelFromOptionsList.innerHTML = '';
        const position = {
            coords: {
                longitude: stop.StopLocation.lon,
                latitude: stop.StopLocation.lat
            }
        }
        showOnMap(position)
    }
    travelFromOptionsList.append(li)
}

searchTo.oninput = async () => {
    const alternatives = await searchStop(searchTo.value)
    const topAlternatives = alternatives.slice(0,5)
    travelToOptionsList.innerHTML = '';
    topAlternatives.forEach(stop => {
        showToAlternatives(stop)
    })
}

const showToAlternatives = (stop) => {
    const li = document.createElement('li')
    li.innerText = stop.StopLocation.name
    li.onclick = () => {
        searchToItem = stop.StopLocation
        searchTo.value = stop.StopLocation.name;
        travelToOptionsList.innerHTML = '';
    }
    travelToOptionsList.append(li)
}

const searchStop = async (input) => {
    const response = await fetch(`https://api.resrobot.se/v2.1/location.name?input=${input}?&format=json&accessId=${API_KEY}`);
    const data = await response.json();
    return data.stopLocationOrCoordLocation
}

const searchTripFromAndTo = async (travelFromId, travelToId) => {
    const response = await fetch(`https://api.resrobot.se/v2.1/trip?format=json&originId=${travelFromId}&destId=${travelToId}&passlist=true&showPassingPoints=true&accessId=${API_KEY}`)
    const data = await response.json();
    return data
}


/* ----- MediaDevices ----- */

const cameraContainer = document.querySelector('[data-camera-container]')
const takePictureText = document.querySelector('[data-take-picture-text]')
const profilePictureContainer = document.querySelector('[data-profile-picture-container]')

const LOCAL_STORAGE_PROFILE_PICTURE = 'profilePicture'

const profilePicture = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PROFILE_PICTURE)) || null;

if (profilePicture) {
    takePictureText.innerHTML = '';
}

takePictureText.onclick = async () => {
    cameraContainer.style.display = 'block'
}