'use client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ToastConfig() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="dark"
      aria-label="Notification messages"
      toastStyle={{
        backgroundColor: '#1F1F23',
        color: '#fff',
        border: '1px solid #3F3F46',
      }}
    />
  );
}