// app/colleges/page.jsx
import { Suspense } from 'react';
import CollegesClient from '@/components/CollegesClient';

export default function CollegesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-lg">Loading Colleges Page...</div>}>
      <CollegesClient />
    </Suspense>
  );
}
