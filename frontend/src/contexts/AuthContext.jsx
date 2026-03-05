import { createContext, useState } from "react";
import axios from "axios";
import httpStatus from "http-status";
import server from "../envirnoment";

export const AuthContext = createContext({});

const client = axios.create({
  baseURL: `${server}/api/v1/users`,
});

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState({});

  const handleRegister = async (email, username, password) => {
    const startTime = performance.now();
    try {
      let request = await client.post("/register", {
        name: email,
        username: username,
        password: password,
      });

      if (request.status === httpStatus.CREATED) {
        console.log(
          `[auth] register completed in ${(performance.now() - startTime).toFixed(0)}ms`,
        );
        return request.data.message;
      }
    } catch (err) {
      console.error(
        `[auth] register failed after ${(performance.now() - startTime).toFixed(0)}ms`,
        err?.response?.data || err.message,
      );
      throw err;
    }
  };

  const handleLogin = async (username, password) => {
    const startTime = performance.now();
    try {
      let request = await client.post("/login", {
        username: username,
        password: password,
      });

      if (request.status === httpStatus.OK) {
        localStorage.setItem("token", request.data.token);
        console.log(
          `[auth] login completed in ${(performance.now() - startTime).toFixed(0)}ms`,
        );
        return request.data;
      }
    } catch (err) {
      console.error(
        `[auth] login failed after ${(performance.now() - startTime).toFixed(0)}ms`,
        err?.response?.data || err.message,
      );
      throw err;
    }
  };

  const getHistoryOfUser = async () => {
    try {
      let request = await client.post("/get_all_activity", {
        token: localStorage.getItem("token"),
      });
      return request.data;
    } catch (err) {
      throw err;
    }
  };

  const addToUserHistory = async (meetingCode) => {
    try {
      let request = await client.post("/add_to_activity", {
        token: localStorage.getItem("token"),
        meeting_code: meetingCode.trim(),
      });
      return request;
    } catch (err) {
      throw err;
    }
  };

  const deleteMeetingFromHistory = async (meetingId) => {
    try {
      const request = await client.post("/delete_activity", {
        token: localStorage.getItem("token"),
        meeting_id: meetingId,
      });
      return request;
    } catch (err) {
      throw err;
    }
  };

  const data = {
    userData,
    setUserData,
    getHistoryOfUser,
    addToUserHistory,
    deleteMeetingFromHistory,
    handleRegister,
    handleLogin,
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};
