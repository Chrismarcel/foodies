/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const host = "https://foodies-nd.herokuapp.com"; // Change this to your server port
    const endpoints = {
      restaurantsEndpoint: `${host}/restaurants`,
      reviewsEndpoint: `${host}/reviews`
    };
    return endpoints;
    // return `./data/restaurants.json`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    const dbPromise = idb.open("foodies", 1, upgradeDB => {
      upgradeDB.createObjectStore("foodies-store", { keyPath: "id" });
    });

    if (!navigator.serviceWorker.controller) {
      const { restaurantsEndpoint } = DBHelper.DATABASE_URL;
      fetch(restaurantsEndpoint)
        .then(response => response.json())
        .then(allRestaurants => {
          allRestaurants.map(restaurant => {
            dbPromise.then(dbObj => {
              const tx = dbObj.transaction("foodies-store", "readwrite");
              const foodiesStore = tx.objectStore("foodies-store");
              foodiesStore.put(restaurant);
            });
          });
          callback(null, allRestaurants);
        })
        .catch(error => {
          // Oops!. Got an error from server.
          callback(error, null);
        });
    } else {
      dbPromise
        .then(dbObj => {
          return dbObj
            .transaction("foodies-store")
            .objectStore("foodies-store")
            .getAll();
        })
        .then(allRestaurants => {
          callback(null, allRestaurants);
        });
    }
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) {
          // Got the restaurant
          callback(null, restaurant);
        } else {
          // Restaurant does not exist in the database
          callback("Restaurant does not exist", null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    callback
  ) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != "all") {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != "all") {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    const imagePath = `./img/${restaurant.id}`;
    return {
      small: `${imagePath}-small.jpg`,
      medium: `${imagePath}-medium.jpg`,
      large: `${imagePath}.jpg`
    };
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker(
      [restaurant.latlng.lat, restaurant.latlng.lng],
      {
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      }
    );
    marker.addTo(newMap);
    return marker;
  }

  /**
   * Register Service Worker script
   */
  static registerServiceWorker() {
    if (!navigator.serviceWorker) return;

    navigator.serviceWorker.register("./sw.js").then(reg => {
      console.log("Service Worker installed successfully");
    });
  }

  static postReview(formData) {
    const { reviewsEndpoint } = DBHelper.DATABASE_URL;
    fetch(`${reviewsEndpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    }).then(() => {
      const dbPromise = idb.open("restaurant-reviews", 1, upgradeDB => {
        upgradeDB.createObjectStore("reviews-store", {
          keyPath: "createdAt"
        });
      });
      dbPromise.then(dbObj => {
        dbObj
          .transaction("reviews-store", "readwrite")
          .objectStore("reviews-store")
          .clear();
      });
      location.reload(true);
    });
  }

  static handleOfflineStatus(formData = {}, isSubmission) {
    document.querySelector(".offline").classList.add("show");

    if (isSubmission) {
      const dbPromise = idb.open("restaurant-reviews", 1, upgradeDB => {
        upgradeDB.createObjectStore("reviews-store", { keyPath: "createdAt" });
      });

      dbPromise.then(dbObj => {
        const tx = dbObj.transaction("reviews-store", "readwrite");
        const restaurantReviews = tx.objectStore("reviews-store");
        restaurantReviews.put(formData);
      });
    }
  }

  static handleOnlineStatus(formData = {}, isSubmission) {
    document.querySelector(".offline").classList.remove("show");

    if (isSubmission) {
      return DBHelper.postReview(formData);
    }

    const dbPromise = idb.open("restaurant-reviews", 1, upgradeDB => {
      upgradeDB.createObjectStore("reviews-store", {
        keyPath: "createdAt"
      });
    });

    dbPromise
      .then(dbObj => {
        return dbObj
          .transaction("reviews-store")
          .objectStore("reviews-store")
          .getAll();
      })
      .then(allReviews => {
        allReviews.map(review => {
          DBHelper.postReview(review);
        });
      });
  }

  static checkConnectionStatus(formData) {
    window.addEventListener("offline", function () {
      DBHelper.handleOfflineStatus(formData, false);
    });

    window.addEventListener("online", function () {
      DBHelper.handleOnlineStatus(formData, false);
    });

    const closeBtn = document.querySelector(".offline .close");
    closeBtn.addEventListener("click", function () {
      document.querySelector(".offline").classList.remove("show");
    });
  }
}
