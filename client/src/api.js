import axios from "axios";

const API = axios.create({
    baseURL: 'https://kcggra-production.up.railway.app/api',
    headers: {
        "Content-Type": 'application/json'
    },
    withCredentials: true
})

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if(error.response?.status === 401){
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default API