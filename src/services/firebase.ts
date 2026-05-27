import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence, setPersistence, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFirebaseWebConfig, validateFirebaseConfig } from "../config/firebase.config";

const firebaseConfig = getFirebaseWebConfig();
export const firebaseInitError = validateFirebaseConfig(firebaseConfig);

export const app = firebaseInitError ? null : getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = app ? getAuth(app) : null;
if (auth) {
  auth.languageCode = "en";

  function isLocalStorageAvailable() {
    try {
      const key = "__ls_test__";
      localStorage.setItem(key, "1");
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  setPersistence(
    auth,
    isLocalStorageAvailable() ? browserLocalPersistence : browserSessionPersistence
  ).catch(() => setPersistence(auth!, inMemoryPersistence).catch(() => {}));
}

export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
export const googleProvider = new GoogleAuthProvider();
