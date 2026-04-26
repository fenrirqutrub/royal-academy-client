import { createContext, useContext, useState, type ReactNode } from "react";
import AddComplain from "../pages/Admin/AddNewItem/AddComplain";

const ComplainContext = createContext<{ openComplain: () => void }>({
  openComplain: () => {},
});

export const ComplainProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ComplainContext.Provider value={{ openComplain: () => setIsOpen(true) }}>
      {children}
      <AddComplain isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </ComplainContext.Provider>
  );
};

export const useComplain = () => useContext(ComplainContext);
