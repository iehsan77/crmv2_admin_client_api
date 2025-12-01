// TopNav.tsx
import TopNavLeft from "./TopNavLeft";
import TopNavRight from "./TopNavRight";

export default function TopNav() {
  return (
    <header className="bg-background sticky top-0 pt-4 pb-1 px-8 z-50">
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 bg-[#EAF3FE] px-4">
        <TopNavLeft />
        <TopNavRight />
      </div>
    </header>
  );
}


// import TopNavLeft from "./TopNavLeft";
// import TopNavRight from "./TopNavRight";

// export default function TopNav() {
//   return (
//     <header className="sticky top-0 z-50 px-8 py-4 bg-white">
//       <div className="bg-[#EAF3FE] flex justify-between">
//         <TopNavLeft />
//         <TopNavRight />
//       </div>
//     </header>
//   );
// }
