import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { logoutAsync, selectLoggedInUser } from '../AuthSlice'
import { useNavigate } from 'react-router-dom'
import { socket } from '../../../socket'

export const Logout = () => {
    const dispatch = useDispatch()
    const loggedInUser = useSelector(selectLoggedInUser)
    const navigate = useNavigate()

    useEffect(() => {
        socket.disconnect()
        dispatch(logoutAsync())
    }, [dispatch])

    useEffect(() => {
        if (!loggedInUser) {
            navigate("/login")
        }
    }, [loggedInUser, navigate])

    return <></>
}
