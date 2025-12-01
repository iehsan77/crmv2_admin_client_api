// utils/withAuthorization.js
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useUserStore from "@/stores/useUserStore";

const withAuthorization = (WrappedComponent, requiredPermission) => {
  return function AuthorizedComponent(props) {
    const router = useRouter();
    const { can } = useUserStore();
    const [authorized, setAuthorized] = useState(null);

    useEffect(() => {
      const hasAccess = can(requiredPermission);
      if (!hasAccess) {
        router.replace("/unauthorized");
        setAuthorized(false);
      } else {
        setAuthorized(true);
      }
    }, [can, requiredPermission]);

    if (authorized === null) return null;
    if (!authorized) return null;

    return <WrappedComponent {...props} />;
  };
};

export default withAuthorization;
