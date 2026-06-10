import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  setUser,
} from '../redux/slices/authSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, loading, error } = useSelector(
    (state) => state.auth
  );

  const login = async (username, password) => {
    dispatch(loginStart());
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username,
        password,
      });
      
      const { token: responseToken, data } = response.data;
      dispatch(loginSuccess({ token: responseToken, user: data.user }));
      return { success: true };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'اسم المستخدم أو كلمة المرور غير صحيحة';
      dispatch(loginFailure(errorMessage));
      return { success: false, error: errorMessage };
    }
  };

  const logoutUser = () => {
    dispatch(logout());
  };

  const checkCurrentUser = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      dispatch(setUser(response.data.data.user));
    } catch (err) {
      dispatch(logout());
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login,
    logout: logoutUser,
    checkCurrentUser,
  };
};
