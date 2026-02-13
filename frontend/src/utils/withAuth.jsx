import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const withAuth = (WrappedComponent) => {
  const AuthComponent = (props) => {
    const navigate = useNavigate();

    const isAuthenticated = () => {
      return Boolean(localStorage.getItem("token"));
    };

    const authenticated = isAuthenticated();

    useEffect(() => {
      if (!authenticated) {
        navigate("/", { replace: true });
      }
    }, [authenticated, navigate]);

    if (!authenticated) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  return AuthComponent;
};

export default withAuth;
