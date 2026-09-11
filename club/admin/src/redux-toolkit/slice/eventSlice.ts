import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface eventType {
  eventList: any[];
}

const initialState: eventType = {
  eventList: []
};


const eventSlice = createSlice({
  name: "Event",
  initialState,
  reducers: {
    setEventList: (state, action: PayloadAction<Event[]>) => {
      state.eventList = action.payload;
    },

    setInterestedAndNotCandidate: (state, action) => {
      const { eventId, userId } = action.payload;

      state.eventList = state.eventList.map((event) => {
        if (event._id === eventId) {
          const alreadyExists = event.interestedCandidate.includes(userId);

          return {
            ...event,
            interestedCandidate: alreadyExists
              ? event.interestedCandidate.filter((id) => id !== userId)
              : [...event.interestedCandidate, userId],
          };
        }

        return event;
      });
    },

    setNewEvent: (state, action: PayloadAction<any>) => {
      state.eventList.unshift(action.payload);
    }
  }
});

export const { setEventList, setInterestedAndNotCandidate, setNewEvent } = eventSlice.actions;

export default eventSlice.reducer;

