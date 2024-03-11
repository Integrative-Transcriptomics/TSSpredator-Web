import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
    // depending on your application, base can also be "/"
    base: '/',
    plugins: [react()],
    server: {
        // this ensures that the browser opens upon server start
        open: true,
        // this sets a default port to 3000  
        port: 5001,
        proxy: {
            // this proxies requests to /api to given port
            '/api': 'http://127.0.0.1:5000',
        }
    },
})