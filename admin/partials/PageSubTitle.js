export default function PageSubTitle ({ title, children }){
    return (
      <>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-2x1/7 font-bold text-gray-900 sm:truncate sm:text-2xl sm:tracking-tight">
            {title}
          </h3>
          {children}
        </div>
      </>
    );
  };
  