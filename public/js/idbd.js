// variable to hold db connection
let db;

// establish a connection 
const request = indexedDb.open('spending_tracker', 1);

request.onupgradeneeded = function(event) {
    // save reference to db
    const db = event.target.result;
    db.createObjectStore('new_event', { autoIncrement: true });
};

request.onsuccess = function(event) {
    // save as global variable
    db = event.target.result;

    // Check if online
    if (navigator.onLine) {
        uploadEvent();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

// function for if event attempted offline
function saveRecord(record) {
    const transaction = db.transaction(['new_event'], 'readwrite');

    // access the object store for 'new_event'
    const transactionObjectStore = transaction.objectStore('new_event');

    // add record to your store with add method
    transactionObjectStore.add(record);
    alert('Your transaction was saved to the offline database');
}

function uploadTransaction() {
    // open transaction on your db
    const transaction = db.transaction(['new_event'], 'readwrite');

    // access your object store
    const transactionObjectStore = transaction.objectStore('new_event');

    // Get all records from store and set to a variable
    const getAll = transactionObjectStore.getAll();

    getAll.onsuccess = function() {
        // if there is data on indexedDb store, send to the api server. 
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST', 
                body: JSON.stringify(getAll.result), 
                    headers: {
                        Accept: 'application/json, text/plain, */*',
                        'Content-Type': 'application/json'
                    }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open one more transaction
                const transaction = db.transaction(['new_event'], 'readwrite');

                // access the new_event object store here
                const transactionObjectStore = transaction.objectStore('new_event');

                // clear all items in store
                transactionObjectStore.clear();

                alert ('All stored transactions have been saved');
            })
            .catch(err => {
                console.log(err);
            });
        }
    };
}

// Listening for internet
window.addEventListener('online', uploadTransaction);