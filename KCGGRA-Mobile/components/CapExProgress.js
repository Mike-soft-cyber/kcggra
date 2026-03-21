import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import api from "../src/services/api";

export default function CapexProgress() {
    const [capex, setCapex] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => { fetchCapexProgress() }, [])

    const fetchCapexProgress = async () => {
        try {
            setLoading(true)
            const res = await api.getProjects()
            setCapex(res)
        } catch (error) {
            console.error("Failed to get Capex Progress:", error.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return (
        <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#16a34a" />
        </View>
    )

    return (
        <View className="px-4 py-2">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-gray-900">CapEx Projects</Text>
                <Text className="text-xs text-gray-400">{capex.length} projects</Text>
            </View>

            <FlatList
                data={capex}
                keyExtractor={(item) => item._id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View className="h-3" />}
                renderItem={({ item }) => {
                    const progress = Math.min(
                        Math.round((item.currentAmount / item.targetAmount) * 100),
                        100
                    )
                    const isCompleted = item.status === 'completed'

                    return (
                        <View
                            className="bg-white rounded-2xl p-4"
                            style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}
                        >
                            {/* Top row */}
                            <View className="flex-row items-center justify-between mb-3">
                                <Text className="text-base font-bold text-gray-900 flex-1 mr-2" numberOfLines={1}>
                                    {item.projectName}
                                </Text>
                                <View style={{
                                    backgroundColor: isCompleted ? '#dcfce7' : '#fef9c3',
                                }}
                                    className="rounded-full px-3 py-0.5"
                                >
                                    <Text style={{ color: isCompleted ? '#166534' : '#854d0e' }}
                                        className="text-xs font-semibold capitalize"
                                    >
                                        {item.status}
                                    </Text>
                                </View>
                            </View>

                            {/* Progress bar */}
                            <View className="h-2 bg-gray-100 rounded-full mb-3">
                                <View
                                    className="h-2 rounded-full"
                                    style={{
                                        width: `${progress}%`,
                                        backgroundColor: isCompleted ? '#16a34a' : '#22c55e'
                                    }}
                                />
                            </View>

                            {/* Amounts */}
                            <View className="flex-row items-center justify-between">
                                <Text className="text-xs text-gray-500">
                                    KES {item.currentAmount?.toLocaleString() ?? 0}
                                    <Text className="text-gray-400"> raised</Text>
                                </Text>
                                <Text className="text-xs font-semibold text-gray-700">
                                    {progress}%
                                </Text>
                                <Text className="text-xs text-gray-500">
                                    Target: KES {item.targetAmount?.toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    )
                }}
                ListEmptyComponent={() => (
                    <View className="items-center py-12">
                        <Text className="text-gray-400 text-base">No CapEx projects yet</Text>
                        <Text className="text-gray-300 text-sm mt-1">Check back later</Text>
                    </View>
                )}
            />
        </View>
    )
}