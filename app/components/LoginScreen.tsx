import { Formik } from "formik";
import { Text, View } from "react-native";
import { Button, Checkbox, TextInput } from "react-native-paper";
import { useState } from "react";
import * as Yup from 'yup';
import { useFirebase } from "../context/FirebaseContext";
import { browserSessionPersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

export default function LoginScreen() {

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
            Our organization helps developers to build organized and well coded dashboards full of beautiful and rich modules. Join us and start building your application today.
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
      if (values.remember) {
        if (typeof window !== 'undefined') {
          await auth.setPersistence(browserSessionPersistence);
        }
      }
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
      if (typeof window !== 'undefined') {
        await auth.setPersistence(browserSessionPersistence);
      }
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