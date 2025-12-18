import axios from "axios";

const api = axios.create({
  // O Vite exige o prefixo VITE_ para reconhecer a variável
  baseURL: import.meta.env.VITE_API_URL, 
});

export default api;