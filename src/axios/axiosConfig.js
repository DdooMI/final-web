import axios from "axios";

export const axiosApi = axios.create({
    baseURL: "https://api.cloudinary.com/v1_1/dckwbkqjv/image/upload"
})
axiosApi.interceptors.request.use((req,) => {
    return req;
})

axiosApi.interceptors.response.use((res) => {
    return res;
})

export const axiosDeleteApi = axios.create({
    baseURL: "http://localhost:5000"
})
axiosDeleteApi.interceptors.request.use((req,) => {
    return req;
})

axiosDeleteApi.interceptors.response.use((res) => {
    return res;
})