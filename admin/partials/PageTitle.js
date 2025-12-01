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
}

export const PageSubTitle = ({ title, children }) => {
  return (
    <div className="flex justify-between items-center mb-3">
      <h3 className="text-xl font-normal text-gray-900 sm:truncate sm:tracking-tight">
        {title}
      </h3>
      {children}
    </div>
  );
};
