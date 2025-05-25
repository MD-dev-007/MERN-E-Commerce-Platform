import React from 'react'
import { Navbar } from '../features/navigation/components/Navbar'
import { CreateAuction } from '../features/admin/components/CreateAuction'

export const CreateAuctionPage = () => {
  return (
    <>
      <Navbar />
      <CreateAuction />
    </>
  )
} 