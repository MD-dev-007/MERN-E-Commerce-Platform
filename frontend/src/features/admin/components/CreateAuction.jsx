import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Button, Stack, TextField, Typography, useMediaQuery, useTheme } from '@mui/material'
import { useForm } from "react-hook-form"
import { selectLoggedInUser } from '../../auth/AuthSlice'
import { toast } from 'react-toastify'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import dayjs from 'dayjs'
import { createAuctionAsync, resetCreateAuctionStatus, selectCreateAuctionStatus } from '../../auction/AuctionSlice'

export const CreateAuction = () => {
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm()
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const loggedInUser = useSelector(selectLoggedInUser)
    const theme = useTheme()
    const is1100 = useMediaQuery(theme.breakpoints.down(1100))
    const is480 = useMediaQuery(theme.breakpoints.down(480))
    const createStatus = useSelector(selectCreateAuctionStatus)

    // Redirect if not admin
    useEffect(() => {
        if (!loggedInUser?.isAdmin) {
            navigate('/')
            toast.error("Unauthorized access")
        }
    }, [loggedInUser])

    const handleCreateAuction = (data) => {
        const startDate = new Date(data.startDateTime)
        const endDate = new Date(startDate.getTime() + (data.duration * 60 * 60 * 1000))
        
        const auctionData = {
            ...data,
            endDateTime: endDate,
            seller: loggedInUser._id
        }
        delete auctionData.duration

        dispatch(createAuctionAsync(auctionData))
    }

    useEffect(() => {
        if (createStatus === 'succeeded') {
            toast.success('Auction created successfully')
            dispatch(resetCreateAuctionStatus())
            navigate('/admin/dashboard')
        } else if (createStatus === 'failed') {
            toast.error('Failed to create auction')
            dispatch(resetCreateAuctionStatus())
        }
    }, [createStatus])

    return (
        <Stack p={'0 16px'} justifyContent={'center'} alignItems={'center'} flexDirection={'row'}>
            <Stack width={is1100 ? "100%" : "60rem"} rowGap={4} mt={is480 ? 4 : 6} mb={6} 
                   component={'form'} noValidate onSubmit={handleSubmit(handleCreateAuction)}>
                
                <Typography variant='h4' textAlign={'center'}>Create New Auction</Typography>

                <Stack rowGap={3}>
                    <Stack>
                        <Typography variant='h6' fontWeight={400} gutterBottom>Product Name</Typography>
                        <TextField {...register("productName", {required: 'Product name is required'})}/>
                    </Stack>

                    <Stack>
                        <Typography variant='h6' fontWeight={400} gutterBottom>Description</Typography>
                        <TextField multiline rows={4} 
                                 {...register("description", {required: 'Description is required'})}/>
                    </Stack>

                    <Stack>
                        <Typography variant='h6' fontWeight={400} gutterBottom>Image URL</Typography>
                        <TextField {...register("imageUrl", {required: 'Image URL is required'})}/>
                    </Stack>

                    <Stack>
                        <Typography variant='h6' fontWeight={400} gutterBottom>Starting Price ($)</Typography>
                        <TextField type="number" 
                                 {...register("startingPrice", {
                                     required: 'Starting price is required',
                                     min: {value: 0, message: 'Price must be positive'}
                                 })}/>
                    </Stack>

                    <Stack>
                        <Typography variant='h6' fontWeight={400} gutterBottom>Start Date & Time</Typography>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DateTimePicker
                                minDateTime={dayjs()}
                                onChange={(newValue) => {
                                    setValue('startDateTime', newValue.toDate())
                                }}
                                slotProps={{
                                    textField: {
                                        variant: 'outlined',
                                        fullWidth: true
                                    }
                                }}
                            />
                        </LocalizationProvider>
                    </Stack>

                    <Stack>
                        <Typography variant='h6' fontWeight={400} gutterBottom>Duration (hours)</Typography>
                        <TextField type="number" 
                                 {...register("duration", {
                                     required: 'Duration is required',
                                     min: {value: 1, message: 'Duration must be at least 1 hour'}
                                 })}/>
                    </Stack>
                </Stack>

                <Button size={is480 ? 'medium' : 'large'} 
                        variant='contained' 
                        type='submit'
                        sx={{alignSelf: 'center', width: 'fit-content'}}>
                    Create Auction
                </Button>
            </Stack>
        </Stack>
    )
} 