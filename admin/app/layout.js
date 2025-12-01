// app/layout.js or app/layout.tsx

import { Nunito_Sans } from 'next/font/google';
import { Toaster } from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";
import "./globals.css";

const nunito = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-nunito',
});

export const metadata = {
  title: 'CRM for professionals',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`antialiased ${nunito.className}`}>
        {children}
        <Toaster position="top-right" />
        <ConfirmModal />
      </body>
    </html>
  );
}


// //import { Geist, Geist_Mono } from "next/font/google";
// import { Inter, Poppins, Lexend_Deca, Nunito_Sans } from 'next/font/google';
// import { Toaster } from "react-hot-toast";
// import ConfirmModal from "@/components/ConfirmModal";
// import "./globals.css";

// const inter = Inter({
//   subsets: ['latin'],
//   variable: '--font-inter',
// });

// const poppins = Poppins({
//   subsets: ['latin'],
//   weight: ['400', '500', '600', '700'], // customize as needed
//   variable: '--font-poppins',
// });

// const lexendDeca = Lexend_Deca({
//   subsets: ['latin'],
//   variable: '--font-lexend',
// });

// export const metadata = {
//   title: 'CRM for professionals',
// };

// export default function RootLayout({ children }) {
//   return (
//     // <html lang="en">
//     <html lang="en" className={`${inter.variable} ${poppins.variable} ${lexendDeca.variable}`}>

//       {/* <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}> */}
//       <body className={`antialiased`} >
//         {children}
//         <Toaster position="top-right" />
//         <ConfirmModal />
//       </body>
//     </html>
//   );
// }
