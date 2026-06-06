import axios from "axios";
export const BASE_URL = "http://10.0.2.2:8000/api";

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export default API;
