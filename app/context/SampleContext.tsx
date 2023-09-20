import React from "react";

const defaultState: AuthState = {
  authenticated: false
}

// Create default context
const AuthContext = React.createContext<AuthState>(defaultState);

export const useAuth = () => React.useContext<AuthState>(AuthContext);

type AuthState = {
  authenticated: boolean;
}

const AuthProvider = ({children}: any) => {
  
  const [state, setState] = React.useState<AuthState>(defaultState);

  const login = async () => {
    setState((oldState: AuthState) => {
      return {...oldState, authenticated: true}
    })
  }

  return (
    <AuthContext.Provider
      value={{
        authenticated: state.authenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
