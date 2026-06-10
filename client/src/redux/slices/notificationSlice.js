import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { notifications: [], loading: false, error: null },
  reducers: {},
});

export default notificationSlice.reducer;
