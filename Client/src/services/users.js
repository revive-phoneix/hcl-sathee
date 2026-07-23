import axios from "axios";
import { API_URL } from "../config/api";

const USERS_API_URL = `${API_URL}/api/users`;

export const fetchUsers = async () => {
  const response = await axios.get(USERS_API_URL);
  return response.data.users ?? [];
};

export const createUser = async (payload) => {
  const response = await axios.post(USERS_API_URL, payload);
  return response.data.user;
};

export const removeUser = async (id) => {
  await axios.delete(`${USERS_API_URL}/${id}`);
};
