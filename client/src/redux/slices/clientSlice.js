import { createSlice } from '@reduxjs/toolkit';

const clientSlice = createSlice({
  name: 'clients',
  initialState: { clients: [], loading: false, error: null },
  reducers: {},
});

export default clientSlice.reducer;
