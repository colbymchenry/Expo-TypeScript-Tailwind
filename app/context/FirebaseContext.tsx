import { FirebaseApp, initializeApp } from 'firebase/app';
import { Firestore, getFirestore, where } from 'firebase/firestore';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    updateEmail,
    updatePassword,
    sendEmailVerification,
    deleteUser as deleteUserAccount,
    sendPasswordResetEmail,
    Auth,
    User,
    signInWithCredential,
    signInWithCustomToken,
    Persistence
} from 'firebase/auth';
import {
    collection,
    addDoc,
    doc,
    getDoc,
    query,
    getDocs,
    setDoc,
    serverTimestamp,
    deleteDoc,
    updateDoc,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, deleteObject, listAll, getDownloadURL, FirebaseStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import LoginScreen from '../components/LoginScreen';

// Initialize Firebase with the provided configuration
let firebaseApp: FirebaseApp;
let firebaseDb: Firestore;
let firebaseAuth: Auth;
let firebaseStorage: FirebaseStorage;

let fireBaseConf = JSON.parse(process.env.EXPO_PUBLIC_FIREBASE || "{}");
try {
    firebaseApp = initializeApp(fireBaseConf, "[DEFAULT]")
    firebaseDb = getFirestore(firebaseApp)
} catch (error: any) {
    /*
     * We skip the "already exists" message which is
     * not an actual error when we're hot-reloading.
     */
    if (!/duplicate-app/u.test(error.message)) {
        console.error('Firebase initialization error', error.stack)
    }
}

firebaseAuth = getAuth();
firebaseStorage = getStorage();

function methods() {
    async function getCollectionData(collectionName: string): Promise<any[]> {
        const collectionRef = collection(firebaseDb, collectionName);
        let result: any[] = [];
        try {
            const querySnapshot = await getDocs(collectionRef);
            querySnapshot.forEach((doc) => {
                result.push({
                    ...doc.data(),
                    id: doc.id
                })
            });
        } catch (error) {
            console.error('Error getting collection: ', error);
        }
        return result;

    }

    // Create a new document in a collection
    async function createDocument(collectionName: string, data: any) {
        try {
            const collectionRef = collection(firebaseDb, collectionName);
            return await addDoc(collectionRef, data);
        } catch (error) {
            console.error('Error creating document: ', error);
        }
    }

    // Set the data of a document in a collection
    async function setDocument(collectionName: string, documentId: string, data: any) {
        try {
            const docRef = doc(firebaseDb, collectionName, documentId);
            return await setDoc(docRef, data);
        } catch (error) {
            console.error('Error setting document: ', error);
        }
    }

    // Update the data of a document in a collection
    async function updateDocument(collectionName: string, documentId: string, data: any) {
        try {
            const docRef = doc(firebaseDb, collectionName, documentId);
            return await updateDoc(docRef, data);
        } catch (error) {
            console.error('Error updating document: ', error);
        }
    }

    // Delete a document from a collection
    async function deleteDocument(collectionName: string, documentId: string) {
        try {
            const docRef = doc(firebaseDb, collectionName, documentId);
            return await deleteDoc(docRef);
        } catch (error) {
            console.error('Error deleting document: ', error);
        }
    }

    // Get a document by its ID
    async function getDocument(collectionName: string, documentId: string) {
        try {
            const docRef = doc(firebaseDb, collectionName, documentId);
            const docSnapshot = await getDoc(docRef);
            if (docSnapshot.exists()) {
                return { id: docSnapshot.id, ...docSnapshot.data() }
            } else {
                console.log('Document not found!');
            }
        } catch (error) {
            console.error('Error getting document: ', error);
        }
    }

    async function getFileURL(path: string) {
        return await getDownloadURL(ref(firebaseStorage, path));
    }

    async function deleteFile(path: string) {
        const fileRef = ref(firebaseStorage, path);
        return await deleteObject(fileRef);
    }

    async function listFiles(path: string) {
        const listRef = ref(firebaseStorage, path);
        const res = await listAll(listRef);
        return res.items;
    }

    async function getCollectionSize(collectionName: string) {
        const collectionRef = collection(firebaseDb, collectionName);
        const snapshot = await getDocs(collectionRef);
        return snapshot.size;
    }

    async function querySearch(collectionName: string, fieldName: string, queryText: string) {
        const collectionRef = collection(firebaseDb, collectionName);
        // Perform the where query to filter the documents based on 'name' field
        const q = query(collectionRef, where(fieldName, ">=", queryText), where(fieldName, "<=", queryText + "\uf8ff"));
        // Get the query snapshot
        const snapshot = await getDocs(q);

        let result: any[] = [];
        snapshot.forEach((doc) => {
            result.push({
                ...doc.data(),
                id: doc.id
            })
        });

        return result;
    }


    return { getCollectionData, createDocument, deleteDocument, updateDocument, setDocument, getDocument, getFileURL, deleteFile, listFiles, getCollectionSize, querySearch }
}

export const FirebaseUtils = methods();


export interface FirebaseContext {
    firebase: FirebaseApp;
    user?: User;
    storage: FirebaseStorage;
    firestore: Firestore;
    auth: Auth;
}

const FirebaseContext = createContext<FirebaseContext>({} as FirebaseContext);
export default FirebaseContext;

export function useFirebase() {
    return useContext(FirebaseContext);
}

export function FirebaseProvider({ children }: any) {
    const [authUser, setAuthUser] = useState<User | undefined>();
    const [authReady, setAuthReady] = useState<boolean>(false);

    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,16}$/;

    useEffect(() => {
        const unsubscribe = firebaseAuth.onAuthStateChanged((user: any) => {
            setAuthUser(user);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        // This ensures we don't show the login screen until the auth state is ready
        (async () => {
            await firebaseAuth.authStateReady();
            setAuthReady(true);
        })();
    }, [])

    const value: FirebaseContext = useMemo(() => {
        return { firebase: firebaseApp, user: authUser, storage: firebaseStorage, firestore: firebaseDb, auth: firebaseAuth }
    }, [authUser]);

    return (
        <FirebaseContext.Provider value={value}>
            {/* Render nothing if auth is not ready, then login if there is no user.
            If there is a user continue rendering the app */}
            {!authReady ? null : !authUser ? (
                <LoginScreen />
            ) : children}
        </FirebaseContext.Provider>
    );
}