import { Stack } from "expo-router";
import { NativeWindStyleSheet } from "nativewind";
import { Button, PaperProvider } from "react-native-paper";
import { Image } from "react-native";
import { FirebaseProvider, useFirebase } from "./context/FirebaseContext";
import { signOut } from "firebase/auth";

NativeWindStyleSheet.setOutput({
  default: "native",
});

export const unstable_settings = {
  initialRouteName: "index",
};

function LogoTitle() {
  return (
    <Image
      style={{ width: 50, height: 50 }}
      source={require('../assets/logo.png')}
    />
  );
}

function LogoutButton() {
  const { auth } = useFirebase();
  return <Button onPress={() => signOut(auth)}>Logout</Button>
}

export default function Layout() {
  return (
    <FirebaseProvider>
      <PaperProvider>
        <Stack
          screenOptions={{
            headerTitle: props => <LogoTitle />,
            headerRight: () => <LogoutButton />,
            headerStyle: {
              backgroundColor: '#f4511e',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
      </PaperProvider>
    </FirebaseProvider>
  );
}
