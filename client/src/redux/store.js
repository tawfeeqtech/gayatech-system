import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import clientReducer from './slices/clientSlice';
import notificationReducer from './slices/notificationSlice';
import transactionReducer from './slices/transactionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    clients: clientReducer,
    notifications: notificationReducer,
    transactions: transactionReducer,
  },
});
