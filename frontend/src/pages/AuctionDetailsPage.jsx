import React from 'react';
import { Navbar } from '../features/navigation/components/Navbar';
import { AuctionDetails } from '../features/auction/components/AuctionDetails';

export const AuctionDetailsPage = () => {
  return (
    <>
      <Navbar />
      <AuctionDetails />
    </>
  );
}; 