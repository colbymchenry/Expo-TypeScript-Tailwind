import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Page() {
  return (
    <View className="flex bg-red-400 items-center justify-center h-screen">
      <View className="max-w-2xl p-8 bg-white rounded-lg shadow">
        <Text className="text-6xl font-bold text-red-500">Hello World</Text>
        <Text className="text-3xl text-gray-700">
          This is the first page of your app.
        </Text>
        <Link className="text-2xl" href="/about">About</Link>
      </View>
    </View>
  );
}