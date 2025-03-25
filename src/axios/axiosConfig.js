import axios from "axios";

const axiosApi = axios.create({
    baseURL: "https://api.cloudinary.com/v1_1/dckwbkqjv/image/upload"
})
axiosApi.interceptors.request.use((req,) => {
    return req;
})

axiosApi.interceptors.response.use((res) => {
    return res;
})

export default axiosApi;