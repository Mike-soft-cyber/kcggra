import { TextInput, Alert, View, Pressable, ActivityIndicator, Text } from "react-native";
import { useState } from "react";
import api from "../services/api";

export default function ProfileCompletionScreen({navigation}){
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        role: 'resident',
        street: ''
    })
    const [loading, setLoading] = useState(false)

    const handleCompleteProfile = async() => {
        try {
            setLoading(true)

            await api.completeProfile(formData)
            setFormData({
                 username: '',
                 email: '',
                 role: 'resident',
                 street: ''
            })
            navigation.navigate('Dashboard')
        } catch (error) {
            Alert.alert('Error', error.message || 'failed to complete profile')
        }finally{
            setLoading(false)
        }
    }

    return(
        <View>
            <Text>Complete your profile below</Text>
            
            <View>
                    <Text>Enter full name</Text>
                    <TextInput
                    value={formData.username}
                    onChangeText={(value) => setFormData(prev => ({...prev, username: value}))}
                    />

                    <Text>Enter email</Text>
                    <TextInput
                    value={formData.email}
                    onChangeText={(value) => setFormData(prev => ({...prev, email: value}))}
                    />

                    <View className="flex flex-row gap-5">
                        <Pressable 
                        onPress={() => setFormData(prev => ({...prev, role: 'resident'}))}
                        className={`${formData.role === 'resident' ? 'bg-green-600' :'bg-gray-200' }`}
                        >
                            <Text>Resident</Text>
                            </Pressable>
                            <Pressable 
                            onPress={() => setFormData(prev => ({...prev, role: 'guard'}))}
                            className={`${formData.role === 'guard' ? 'bg-green-600' :'bg-gray-200' }`}
                            >
                                <Text>Guard</Text>
                                </Pressable>
                                <Pressable 
                                onPress={() => setFormData(prev => ({...prev, role: 'admin'}))}
                                className={`${formData.role === 'admin' ? 'bg-green-600' :'bg-gray-200' }`}
                                >
                                    <Text>Admin</Text>
                                    </Pressable>
                                    </View>

                    <Text>Enter Street Address</Text>
                    <TextInput
                    value={formData.street}
                    onChangeText={(value) => setFormData(prev => ({...prev, street: value}))}
                    />

                    <Pressable onPress={handleCompleteProfile}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-white">Complete Profile</Text>
                        )}
                    </Pressable>
            </View>
        </View>
    )
}