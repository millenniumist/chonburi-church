'use client';

import FloatingFeedback from './contact/FloatingFeedback';

export default function PageWrapper({ children }) {
  return (
    <>
      <div>
        {children}
      </div>
      <FloatingFeedback />
    </>
  );
}
