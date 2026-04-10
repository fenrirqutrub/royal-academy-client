// context/LoaderContext.tsx
import { createContext, useContext, useState } from "react";
import Loader from "../components/common/Loader";

const LoaderContext = createContext<{
  showLoader: () => void;
  hideLoader: () => void;
}>({ showLoader: () => {}, hideLoader: () => {} });

export const LoaderProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(false);

  return (
    <LoaderContext.Provider
      value={{
        showLoader: () => setLoading(true),
        hideLoader: () => setLoading(false),
      }}
    >
      {loading && <Loader />}
      {children}
    </LoaderContext.Provider>
  );
};

export const useLoader = () => useContext(LoaderContext);
