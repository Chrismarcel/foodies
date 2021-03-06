let restaurant;
var newMap;

/**
 * Register Service Worker script
 */
if (!navigator.serviceWorker.controller) {
  DBHelper.registerServiceWorker();
}

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", event => {
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map("map", {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer(
        "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}",
        {
          mapboxToken:
            "pk.eyJ1IjoiY2hyaXNtYXJjZWwiLCJhIjoiY2prY2o4MnVpMGExdjNwcXMwa3g0M2oybiJ9.vwuaZuEdsIUGK1Xv0KCJVg",
          maxZoom: 18,
          attribution:
            'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
            '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
          id: "mapbox.streets"
        }
      ).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = callback => {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName("id");
  if (!id) {
    // no id found in URL
    error = "No restaurant id in URL";
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById("restaurant-name");
  name.innerHTML = restaurant.name;

  const address = document.getElementById("restaurant-address");
  address.innerHTML = restaurant.address;

  const imageList = DBHelper.imageUrlForRestaurant(restaurant);
  const image = document.getElementById("restaurant-img");
  image.className = "restaurant-img";
  image.src = imageList.small;
  image.alt = `${restaurant.name} Restaurant`;
  image.title = `${restaurant.name} Restaurant`;
  image.srcset = `${imageList.small} 350w, ${imageList.medium} 500w, ${
    imageList.large
  } 800w`;
  image.sizes = `(min-width: 800px) 30vw, (min-width: 500px) and (max-width: 699px) 20vw, 10vw`;

  const restaurantId = Number(getParameterByName("id"));
  const cuisine = document.getElementById("restaurant-cuisine");
  cuisine.innerHTML = restaurant.cuisine_type;

  // Check if restaurant has been added to favorites
  const { is_favorite } = restaurant;
  const favoriteBtn = document.querySelector("#favorite .btn");
  if (is_favorite) {
    favoriteBtn.innerHTML = `Remove from favorites`;
    favoriteBtn.classList.add("remove-favorite");
  } else {
    favoriteBtn.innerHTML = `<span>♥</span> Add to favorites`;
    favoriteBtn.classList.add("add-favorite");
  }

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  const { reviewsEndpoint } = DBHelper.DATABASE_URL;
  fetch(`${reviewsEndpoint}/?restaurant_id=${restaurantId}`)
    .then(response => response.json())
    .then(allReviews => {
      fillReviewsHTML(allReviews.reverse());
    });
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (
  operatingHours = self.restaurant.operating_hours
) => {
  const hours = document.getElementById("restaurant-hours");
  for (let key in operatingHours) {
    const row = document.createElement("tr");

    const day = document.createElement("td");
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement("td");
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById("reviews-container");
  const title = document.createElement("h2");
  title.innerHTML = "Reviews";
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement("p");
    noReviews.innerHTML = "No reviews yet!";
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById("reviews-list");
  reviews.forEach((review, index) => {
    ul.appendChild(createReviewHTML(review, index));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review, index) => {
  const li = document.createElement("li");
  const name = document.createElement("h3");
  name.classList.add("reviewer-name");
  name.innerHTML = review.name;
  li.appendChild(name);
  const date = document.createElement("p");
  date.innerHTML = formatDate(review.updatedAt);
  li.appendChild(date);

  // Loop through the ratings and display stars instead of text ratings
  const ratings = document.createElement("div");
  ratings.tabIndex = 0;
  ratings.setAttribute("aria-describedby", `restaurant-ratings-${index}`);

  const ratingARIA = document.createElement("span");
  ratingARIA.classList.add("sr-only");
  ratingARIA.setAttribute("id", `restaurant-ratings-${index}`);
  ratingARIA.textContent = `Review - ${review.rating} over 5 stars`;
  ratings.appendChild(ratingARIA);

  for (let i = 1; i <= 5; i++) {
    const rating = document.createElement("span");
    rating.classList.add("rating-stars");
    rating.innerHTML = `★`;
    if (review.rating < i) {
      rating.innerHTML = `☆`;
    }
    ratings.appendChild(rating);
  }
  li.appendChild(ratings);

  const comments = document.createElement("p");
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById("breadcrumb");
  const li = document.createElement("li");
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
};

/**
 * Format review date
 */
const formatDate = timestamp => {
  const date = new Date(timestamp);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];
  const year = date.getFullYear();
  const month = monthNames[date.getMonth()];
  const day = date.getDay();
  return `${month} ${day}, ${year}`;
};

/**
 * Handle Review form event listener
 */
const reviewForm = document.querySelector(".review-form");

reviewForm.addEventListener("submit", function(event) {
  event.preventDefault();
  const reviewDate = new Date().getTime();
  const name = document.querySelector(".name").value;
  const comments = document.querySelector(".comment").value;
  const restaurantId = Number(getParameterByName("id"));
  const rating = document.querySelector(".rating").value;
  const review = {
    comments,
    name,
    rating,
    restaurant_id: restaurantId,
    createdAt: reviewDate,
    updatedAt: reviewDate
  };

  if (navigator.onLine) {
    DBHelper.handleOnlineStatus(review, true);
  } else {
    DBHelper.handleOfflineStatus(review, true);
  }
});

/**
 * Handle Favorite button event listener
 */
const favoriteBtn = document.querySelector("#favorite .btn");
favoriteBtn.addEventListener("click", function() {
  const restaurantId = Number(getParameterByName("id"));
  const { restaurantsEndpoint } = DBHelper.DATABASE_URL;
  const classNames = Array.from(favoriteBtn.classList);
  let endpointQuery = false;

  if (classNames.includes("add-favorite")) {
    endpointQuery = true;
    favoriteBtn.innerHTML = `Remove from favorites`;
    favoriteBtn.classList.remove("add-favorite");
    favoriteBtn.classList.add("remove-favorite");
  } else {
    favoriteBtn.innerHTML = `<span>♥</span> Add to favorites`;
    favoriteBtn.classList.remove("remove-favorite");
    favoriteBtn.classList.add("add-favorite");
  }

  const dbPromise = idb.open("foodies", 1, upgradeDB => {
    upgradeDB.createObjectStore("foodies-store", { keyPath: "id" });
  });

  fetch(
    `${restaurantsEndpoint}/${restaurantId}/?is_favorite=${endpointQuery}`,
    {
      method: "PUT"
    }
  )
    .then(response => response.json())
    .then(responseObj => {
      dbPromise.then(dbObj => {
        const tx = dbObj.transaction("foodies-store", "readwrite");
        const foodiesStore = tx.objectStore("foodies-store");
        foodiesStore.put(responseObj);
      });
    });
});

DBHelper.checkConnectionStatus({});
