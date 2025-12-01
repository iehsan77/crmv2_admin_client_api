export default function WizardTitle({ step=1}) {
  const stepTitles = {
    1: "Profile Information",
    2: "Verify",
    3: "Company Details",
    4: "Domain Setup",
    5: "Features Selection",
  };

  const stepDescriptions = {
    1: "Fill in your profile information",
    2: "Please verify your email",
    3: "Tell us about your business",
    4: "Set up your company domain",
    5: "Customize your CRM exprience",
  };

  return (
    <>
      <div className="mb-6 space-y-2">
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>{stepTitles[step]}</span>
          <span>Step {step} of 5</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-2 transition-all duration-300 ease-in-out"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">{stepTitles[step]}</h3>
        <p className="text-sm text-muted-foreground">
          {stepDescriptions[step]}
        </p>
      </div>
    </>
  );
}
