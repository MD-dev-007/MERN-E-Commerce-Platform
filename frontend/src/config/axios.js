import axios from 'axios'

export const axiosi = axios.create({
    baseURL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000',
    timeout: 5000,
    withCredentials: true
})

axiosi.interceptors.response.use(
    response => response,
    error => {
        if (error.code === 'ECONNABORTED') {
            // Handle timeout
            return Promise.reject({ 
                response: { 
                    data: { message: 'Request timed out, please try again' } 
                } 
            });
        }
        
        if (error.response?.status === 401 && !error.config.url.includes('check-auth')) {
            localStorage.removeItem('isLoggedIn')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)