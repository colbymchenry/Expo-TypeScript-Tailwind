import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import * as Yup from 'yup';
import { Formik } from "formik";
import { Text, View } from "react-native";
import { Button, Checkbox, TextInput } from "react-native-paper";
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
    Persistence,
    initializeAuth,
    getReactNativePersistence,
    browserSessionPersistence
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
import { Platform } from 'react-native';

// Initialize Firebase with the provided configuration
let firebaseApp: FirebaseApp;
let firebaseDb: Firestore;
let firebaseAuth: Auth;
let firebaseStorage: FirebaseStorage;

let fireBaseConf = JSON.parse(process.env.EXPO_PUBLIC_FIREBASE || "{}");
try {
    firebaseApp = initializeApp(fireBaseConf, "[DEFAULT]");
    firebaseDb = getFirestore(firebaseApp);
    firebaseAuth = initializeAuth(firebaseApp, {
        persistence: Platform.OS === 'web' ? browserSessionPersistence : getReactNativePersistence(ReactNativeAsyncStorage)
    });
    firebaseStorage = getStorage();
} catch (error: any) {
    /*
     * We skip the "already exists" message which is
     * not an actual error when we're hot-reloading.
     */
    if (!/duplicate-app/u.test(error.message)) {
        console.error('Firebase initialization error', error.stack)
    }
}



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

function LoginScreen() {

    const [signup, setSignup] = useState<boolean>(false);
  
    return (
      <View className="flex flex-row w-full h-full bg-blue-50 md:bg-white">
        {/* Left Side Code Start */}
        <View className="flex-1 flex flex-row h-full items-center justify-center">
          {/* Form container */}
          <View className="flex flex-col sm:justify-center w-full h-full sm:h-fit md:max-w-[360px] bg-white shadow-md rounded-lg md:shadow-none px-8 py-16">
            <Text className="text-4xl font-extrabold tracking-tight leading-tight">
              {signup ? "Sign up" : "Sign in"}
            </Text>
            {/* Sign up blurb */}
            <View className="flex flex-row items-baseline mt-2 font-medium flex-nowrap">
              {signup ?
                <>
                  <Text>Already have an account?</Text>
                  <Button onPress={() => setSignup(false)} className="text-indigo-600 underline font-bold">Sign-in</Button>
                </>
                :
                <>
                  <Text>Don't have an account?</Text>
                  <Button onPress={() => setSignup(true)} className="text-indigo-600 underline font-bold">Sign-up</Button>
                </>
              }
            </View>
            {/* Form */}
            {signup ? <SignupForm /> : <LoginForm />}
          </View>
        </View>
        {/* Right Side Code Start */}
        <View className="flex-1 relative hidden lg:flex items-center justify-center h-full p-12 overflow-hidden bg-slate-800">
          <View className="z-10 relative w-full max-w-2xl">
            {/* Heading */}
            <View className="flex flex-col">
              <Text className="text-7xl font-bold leading-none text-gray-100">
                Welcome to
              </Text>
              <Text className="text-7xl font-bold leading-none text-gray-100">
                our community
              </Text>
            </View>
            {/* Blurb */}
            <Text className="mt-8 text-lg tracking-tight leading-6 text-gray-400">
              Pythius helps developers to build organized and well coded dashboards full of beautiful and rich modules. Join us and start building your application today.
            </Text>
          </View>
        </View>
      </View>
    );
  }
  
  const LoginForm = () => {
  
    const { auth } = useFirebase();
    const [submitted, setSubmitted] = useState<boolean>(false);
  
    async function onSubmit(values: any, helpers: any) {
      if (submitted) return;
      setSubmitted(true);
      try {
        await signInWithEmailAndPassword(auth, values.email, values.password);
      } catch (error: any) {
        console.log(error.code)
        switch (error.code) {
          case 'auth/user-not-found': {
            helpers.setErrors({
              password: 'Invalid login credentials'
            });
            break;
          }
          case 'auth/wrong-password': {
            helpers.setErrors({
              password: 'Invalid login credentials'
            });
            break;
          }
          case 'auth/invalid-login-credentials': {
            helpers.setErrors({
              password: 'Invalid login credentials'
            });
            break;
          }
          case 'auth/too-many-requests': {
            helpers.setErrors({
              password: 'Login temporarily disabled. Try again later'
            });
            break;
          }
        }
        setSubmitted(false);
      }
    }
  
    return (
      <Formik validationSchema={Yup.object().shape({
        email: Yup.string().email("Please enter a proper email").required("Email is required"),
        password: Yup.string().required("Password is required"),
      })}
        initialValues={{ email: '', remember: false, password: '' }}
        onSubmit={onSubmit}
      >
        {({ handleSubmit, values, setFieldValue, isValid, dirty, touched, errors, setFieldTouched }) => (
          <View className="flex flex-col justify-center w-full mt-10">
            {renderInput({
              label: "Email *",
              name: 'email',
              values, errors, touched, setFieldTouched, setFieldValue
            })}
            {renderInput({
              label: "Password *",
              name: 'password',
              secureTextEntry: true,
              values, errors, touched, setFieldTouched, setFieldValue
            })}
            <Checkbox.Item label="Remember me?" status={values.remember ? "checked" : "unchecked"} onPress={(e) => setFieldValue("remember", values.remember ? false : true)} />
            <Button mode="contained" onPress={(e: any) => handleSubmit(e)} className="mt-4" loading={submitted} disabled={submitted || !(isValid && dirty)}>
              Sign in
            </Button>
          </View>
        )}
      </Formik>
    )
  }
  
  const SignupForm = () => {
    const { auth } = useFirebase();
    const [submitted, setSubmitted] = useState<boolean>(false);
  
    async function onSubmit(values: any, helpers: any) {
      if (submitted) return;
      setSubmitted(true);
      try {
        await createUserWithEmailAndPassword(auth, values.email, values.password);
      } catch (error: any) {
        switch (error.code) {
          case 'auth/email-already-in-use': {
            helpers.setErrors({
              email: 'Email already in use'
            });
            break;
          }
          case 'auth/weak-password': {
            helpers.setErrors({
              password: 'Password is too weak'
            });
            break;
          }
        }
        setSubmitted(false);
      }
    }
  
    return (
      <Formik validationSchema={Yup.object().shape({
        email: Yup.string().email("Please enter a proper email").required("Email is required"),
        displayName: Yup.string().required("Display name is required"),
        password: Yup.string().required("Password is required"),
        confirmPassword: Yup.string().oneOf([Yup.ref('password'), undefined], 'Passwords must match').required("Confirm password is required")
      })}
        initialValues={{ email: '', agreeLegal: false, password: '', confirmPassword: '', displayName: '' }}
        onSubmit={onSubmit}
      >
        {({ handleSubmit, values, setFieldValue, isValid, dirty, touched, errors, setFieldTouched }) => (
          <View className="flex flex-col justify-center w-full mt-10">
            {renderInput({
              label: "Display name *",
              name: 'displayName',
              values, errors, touched, setFieldTouched, setFieldValue
            })}
            {renderInput({
              label: "Email *",
              name: 'email',
              values, errors, touched, setFieldTouched, setFieldValue
            })}
            {renderInput({
              label: "Password *",
              name: 'password',
              secureTextEntry: true,
              values, errors, touched, setFieldTouched, setFieldValue
            })}
            {renderInput({
              label: "Password (Confirm) *",
              name: 'confirmPassword',
              secureTextEntry: true,
              values, errors, touched, setFieldTouched, setFieldValue
            })}
            <Checkbox.Item position="leading" labelStyle={{ textAlign: 'left' }} style={{ padding: 0 }} label="I agree to the Terms of Service and Privacy Policy" status={values.agreeLegal ? "checked" : "unchecked"} onPress={(e) => setFieldValue("agreeLegal", values.agreeLegal ? false : true)} />
            <Button mode="contained" onPress={(e: any) => handleSubmit(e)} className="mt-4" loading={submitted} disabled={submitted || !(isValid && dirty)}>
              Create your free account
            </Button>
          </View>
        )}
      </Formik>
    )
  }
  
  const renderInput = (props: {
    label: string;
    name: string;
    values: any;
    setFieldValue: any;
    setFieldTouched: any;
    touched: any;
    errors: any;
    secureTextEntry?: boolean;
  }) => {
    return (
      <View className="flex flex-col mb-4 gap-1 overflow-hidden">
        <TextInput
          label={props.label}
          value={props.values[props.name]}
          onChangeText={text => props.setFieldValue(props.name, text)}
          error={Boolean(
            props.touched[props.name] && props.errors[props.name]
          )}
          onBlur={() => props.setFieldTouched(props.name)}
          secureTextEntry={props.secureTextEntry}
        />
        {props.errors[props.name] && props.touched[props.name] ? <Text className="text-red-700">{props.errors[props.name]}</Text> : null}
      </View>
    )
  }