import { axiosi } from "../../config/axios";

export const createAuction = async (data) => {
    try {
        const res = await axiosi.post('/auctions', data)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const fetchAuctions = async (filters) => {
    let queryString = ''
    
    if (filters?.pagination) {
        queryString += `page=${filters.pagination.page}&limit=${filters.pagination.limit}&`
    }

    if (filters?.seller) {
        queryString += `seller=${filters.seller}&`
    }

    try {
        const res = await axiosi.get(`/auctions?${queryString}`)
        const totalResults = res.headers.get("X-Total-Count")
        return { data: res.data, totalResults }
    } catch (error) {
        throw error.response.data
    }
}

export const fetchAuctionById = async (id) => {
    try {
        const res = await axiosi.get(`/auctions/${id}`)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const placeBid = async (auctionId, bidData) => {
    try {
        const res = await axiosi.post(`/auctions/${auctionId}/bid`, bidData)
        return res.data
    } catch (error) {
        throw error.response.data
    }
} 