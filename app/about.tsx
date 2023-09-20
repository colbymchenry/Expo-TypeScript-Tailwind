import { Text, View } from "react-native";

export default function Page() {
  return (
    <View className="flex bg-blue-400 items-center justify-center h-screen">
      <View className="max-w-2xl p-8 bg-white rounded-lg shadow">
        <Text className="text-6xl font-bold text-blue-500">About</Text>
        <Text className="text-3xl text-gray-700">
          This is the about page
        </Text>
      </View>
    </View>
  );
}