import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";


import { FcGoogle } from "react-icons/fc";
import { SlSocialGithub } from "react-icons/sl";
import { TfiMicrosoft } from "react-icons/tfi";

export default function SocialBtns() {

  const [isLoading, setIsLoading] = useState(false);

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            type="button"
            disabled={isLoading}
            //onClick={() => handleSocialLogin("Google")}
            className="bg-background"
          >
            <FcGoogle />
            Google
          </Button>
          <Button
            variant="outline"
            type="button"
            disabled={isLoading}
            //onClick={() => handleSocialLogin("GitHub")}
            className="bg-background"
          >
            <SlSocialGithub />
            GitHub
          </Button>
          <Button
            variant="outline"
            type="button"
            disabled={isLoading}
            //onClick={() => handleSocialLogin("Microsoft")}
            className="bg-background"
          >
            <TfiMicrosoft />
            Microsoft
          </Button>
        </div>
    </>
  );
}
