export const PageTitle = ({ title, children }) => {
  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-2xl font-bold text-gray-900 sm:truncate sm:tracking-tight">
          {title}
        </h2>
        {children}
      </div>
    </>
  );
};

export const PageSubTitle = ({ title, children }) => {
  return (
    <div className="flex justify-between items-center mb-3">
      {/* <div className="text-2x1 text-gray-700 sm:truncate sm:text-1xl sm:tracking-tight"> */}
      <div className="text-xl">{title}</div>
      {children}
    </div>
  );
};
