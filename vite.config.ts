import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
    // depending on your application, base can also be "/"
    base: '',
    plugins: [react()],
    server: {    
        // this ensures that the browser opens upon server start
        open: true,
        // this sets a default port to 3000  
        port: 3000, 
        proxy: {
            // this proxies requests to /api to http://localhost:8080
            '/api': 'http://localhost:5000',
            '/fetchFile': 'http://localhost:5000',
        }
    },
})