// firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    push,
    set,
    get,
    child,
    update,
    remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import {
    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

/*
==================================
THAY THÔNG TIN FIREBASE CỦA BẠN
==================================
*/

const firebaseConfig = {
apiKey: "AIzaSyAwv0kDiGGvFcpZm2lKhD9Jq6dFoJXWGm0",
authDomain: "global-power-ranking.firebaseapp.com",
databaseURL: "https://global-power-ranking-default-rtdb.asia-southeast1.firebasedatabase.app",
projectId: "global-power-ranking",
storageBucket: "global-power-ranking.firebasestorage.app",
messagingSenderId: "382870176620",
appId: "1:382870176620:web:2223021ac756c798a2e949"

};
/*
==================================
INIT
==================================
*/

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);

const storage = getStorage(app);

/*
==================================
EXPORT
==================================
*/

export {
    db,
    storage,

    ref,
    push,
    set,
    get,
    child,
    update,
    remove,

    storageRef,
    uploadBytes,
    getDownloadURL
};