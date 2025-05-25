import React from 'react';
import { Navbar } from '../features/navigation/components/Navbar';
import { AuctionList } from '../features/auction/components/AuctionList';

export const AuctionsPage = () => {
  return (
    <>
      <Navbar />
      <AuctionList />
    </>
  );
}; 