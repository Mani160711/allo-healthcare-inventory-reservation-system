import React from 'react';
import ReservationDetailClient from '@/components/reservation-detail-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReservationPage({ params }: PageProps) {
  
  const { id } = await params;

  return <ReservationDetailClient id={id} />;
}
