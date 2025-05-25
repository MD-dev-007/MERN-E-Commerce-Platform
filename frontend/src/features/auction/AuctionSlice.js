import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { createAuction, fetchAuctionById, fetchAuctions, placeBid } from "./AuctionApi";

const initialState = {
    status: "idle",
    auctions: [],
    selectedAuction: null,
    totalResults: 0,
    errors: null,
    successMessage: null,
    createAuctionStatus: 'idle',
    bidStatus: 'idle'
}

export const createAuctionAsync = createAsyncThunk(
    "auction/createAuctionAsync",
    async (data) => {
        const response = await createAuction(data)
        return response
    }
)

export const fetchAuctionsAsync = createAsyncThunk(
    "auction/fetchAuctionsAsync",
    async () => {
        const response = await fetchAuctions()
        return response
    }
)

export const fetchAuctionByIdAsync = createAsyncThunk(
    "auction/fetchAuctionByIdAsync",
    async (id) => {
        const response = await fetchAuctionById(id)
        return response
    }
)

export const placeBidAsync = createAsyncThunk(
    "auction/placeBidAsync",
    async ({auctionId, bidData}) => {
        const response = await placeBid(auctionId, bidData)
        return response
    }
)

const auctionSlice = createSlice({
    name: 'auction',
    initialState,
    reducers: {
        resetCreateAuctionStatus: (state) => {
            state.createAuctionStatus = 'idle'
        },
        clearSelectedAuction: (state) => {
            state.selectedAuction = null
        },
        bidPlaced: (state, action) => {
            state.selectedAuction = action.payload;
            if (state.auctions.length > 0) {
                const index = state.auctions.findIndex(a => a._id === action.payload._id);
                if (index !== -1) {
                    state.auctions[index] = action.payload;
                }
            }
        },
        resetBidStatus: (state) => {
            state.bidStatus = 'idle'
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(createAuctionAsync.pending, (state) => {
                state.createAuctionStatus = 'loading'
            })
            .addCase(createAuctionAsync.fulfilled, (state, action) => {
                state.createAuctionStatus = 'succeeded'
                state.successMessage = 'Auction created successfully'
            })
            .addCase(createAuctionAsync.rejected, (state, action) => {
                state.createAuctionStatus = 'failed'
                state.errors = action.error.message
            })
            .addCase(fetchAuctionsAsync.pending, (state) => {
                state.status = 'loading'
            })
            .addCase(fetchAuctionsAsync.fulfilled, (state, action) => {
                state.status = 'succeeded'
                state.auctions = action.payload.data
                state.totalResults = action.payload.totalResults
            })
            .addCase(fetchAuctionsAsync.rejected, (state, action) => {
                state.status = 'failed'
                state.errors = action.error.message
            })
            .addCase(fetchAuctionByIdAsync.pending, (state) => {
                state.status = 'loading'
            })
            .addCase(fetchAuctionByIdAsync.fulfilled, (state, action) => {
                state.status = 'succeeded'
                state.selectedAuction = action.payload
            })
            .addCase(fetchAuctionByIdAsync.rejected, (state, action) => {
                state.status = 'failed'
                state.errors = action.error.message
            })
            .addCase(placeBidAsync.pending, (state) => {
                state.bidStatus = 'loading'
            })
            .addCase(placeBidAsync.fulfilled, (state, action) => {
                state.bidStatus = 'succeeded'
                state.selectedAuction = action.payload
            })
            .addCase(placeBidAsync.rejected, (state, action) => {
                state.bidStatus = 'failed'
                state.errors = action.error.message
            })
    }
})

export const { resetCreateAuctionStatus, clearSelectedAuction, bidPlaced, resetBidStatus } = auctionSlice.actions
export default auctionSlice.reducer

export const selectAuctions = (state) => state.AuctionSlice.auctions
export const selectSelectedAuction = (state) => state.AuctionSlice.selectedAuction
export const selectCreateAuctionStatus = (state) => state.AuctionSlice.createAuctionStatus
export const selectBidStatus = (state) => state.AuctionSlice.bidStatus 