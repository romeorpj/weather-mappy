"use strict"
let input1 = document.querySelector("#input1");
let btn1 = document.querySelector(".header-btn1");
let marker = new mapboxgl.Marker();
let map;
let mapChoices = document.querySelector("#map-selector");

//provides a simple way to update weather coords for both forward geocode and reverse
let coordsObj = {
    long: "",
    lat: ""
}


function setupMap(center) {
//    this function sets the starting details of the map
    mapboxgl.accessToken = MAPBOX_KEY;
    map = new mapboxgl.Map({
        container: 'map', // container ID
        style: "mapbox://styles/mapbox/streets-v11", // style URL
        // center coords are pulled from wather-map geolocation
        center: center, // starting position [lng, lat]
        zoom: 16, // starting zoom
        trackResize: true,
    })




// Add zoom and rotation controls to the map.
    map.addControl(new mapboxgl.NavigationControl({
        visualizePitch: true
    }),'bottom-right');

// ***TODO: REVERSE GEOCODING
    map.on('click', (e) => {
        // let coordinates = {lng:e.lngLat.lng, lat:e.lngLat.lat};
        coordsObj.lat = e.lngLat.lat;
        coordsObj.long = e.lngLat.lng;
        reverseGeocode(coordsObj, MAPBOX_KEY).then((results) => {
            // console.log(`this is results ${results}`)
            getMapboxWeather(coordsObj).then(mapWeatherData => {
                outputMapboxWeather(mapWeatherData)
            }).catch(error => {
                console.log(`This is probably somewhat kind of maybe not a good thing: ${error}`)
            })
            placeMarkerAndPopup(results, MAPBOX_KEY, map);
            console.log(`this is results reverse ${results}`)
        })
    });
}
//END MAP OBJECT

function reverseGeocode(coordsObj, token) {
    var baseUrl = 'https://api.mapbox.com';
    var endPoint = '/geocoding/v5/mapbox.places/';
    return fetch(baseUrl + endPoint + coordsObj.long + "," + coordsObj.lat + '.json' + "?" + 'access_token=' + token)
        .then(function(res) {
            return res.json();
        })
        // to get all the data from the request, comment out the following three lines...
        .then(function(data) {
            return data.features[0].place_name;
        });
}




//TODO: MARKERS & POPUP
function placeMarkerAndPopup(info, token, map) {
    geocode(info, token).then(function(coordinates) {
        let popup = new mapboxgl.Popup()
            .setHTML(`<h2>Your location results:</h2>
${info}`);
        marker
            .setLngLat(coordinates);
            marker.addTo(map)
            .setPopup(popup);
        popup.addTo(map);
    });
}
//TODO: GEOCODING
btn1.addEventListener("click",(e)=>{
let geoSearch = input1.value;

    geocode(geoSearch, MAPBOX_KEY).then(function(result) {
        console.log(result)
        map.setCenter(result);
        map.setZoom(16);
        coordsObj.lat = result[1];
        coordsObj.long = result[0];
        placeMarkerAndPopup(geoSearch, MAPBOX_KEY, map);
        getMapboxWeather(coordsObj).then(mapWeatherData => {
            outputMapboxWeather(mapWeatherData)
            console.log(mapWeatherData);
        }).catch(error => {
            console.log(`This is probably somewhat kind of maybe not a good thing: ${error}`)
        })
    })
    input1.value = "";
});

// TODO: getWeatherData calls the openweather API *** TO UPDATE THE FORWARD GEOCODE WEATHER
async function getMapboxWeather(result) {

    // let [mapLong, mapLat] = result;
    const response = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${coordsObj.lat}&lon=${coordsObj.long}&&units=imperial&exclude=current,hourly,minutely&appid=${OWM_KEY}`)
    if (!response.ok) {
        new Error(`HTTP error! status: ${response.status}`)
    } else {
        return await response.json();
    }
}


function outputMapboxWeather(mapWeatherData){
    forecastScroller.innerHTML = "";
    for(let i = 0; i <= 6; i++) {

        forecastScroller.innerHTML +=  `
         <div class="forecast flex-col">
          <div class="date-container flex-row">
              <img src="http://openweathermap.org/img/wn/${mapWeatherData.daily[i].weather[0].icon}@2x.png" class="owm-icon">
       <p class="forecast-day">
           ${new Date(mapWeatherData.daily[i].dt * 1000).toLocaleString('en-us', {weekday: 'short'})}
           </p>
       </div>
       <div class="forecast-hilo flex-row">
           <p class="forecast-lo">Lo: <span class="hilo-temp">${Math.round(mapWeatherData.daily[i].temp.min)}&#176;</span></p>
           <p class="forecast-hi">Hi: <span class="hilo-temp">${Math.round(mapWeatherData.daily[i].temp.max)}&#176;</span></p>
       </div>
       <div class="description-wrapper flex-col">
           <p class="description-output">${mapWeatherData.daily[i].weather[0].description}</p>
       </div>
       <div class="humidity-wrapper flex-row">
           <p class="humidity-title">Humidity:</p>
           <p class="humidity-output">${mapWeatherData.daily[i].humidity}</p>
       </div>
       <div class="wind-speed-wrapper flex-row">
           <p class="wind-speed-title">Wind Speed:</p>
           <p class="wind-speed-output">${mapWeatherData.daily[i].wind_speed}</p>
       </div>
         </div>
     `
    }
    let newDiv = document.createElement("div");
    newDiv.classList.add("hide-forecast-btn");
    newDiv.innerHTML = `<i class="fa-solid fa-caret-left"></i>`
    forecastScroller.appendChild(newDiv);

    document.querySelector(".hide-forecast-btn").addEventListener("click", () => {
        // console.log("hide is working")
        forecastScroller.classList.toggle("active")
    })
}

mapChoices.addEventListener("change", () => {
    map.setStyle(mapChoices.value);

})