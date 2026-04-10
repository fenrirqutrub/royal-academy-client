import { createContext, useContext, useState, type ReactNode } from "react";

interface ProfileDrawerCtx {
  open: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const ProfileDrawerContext = createContext<ProfileDrawerCtx>({
  open: false,
  openDrawer: () => {},
  closeDrawer: () => {},
});

export const ProfileDrawerProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <ProfileDrawerContext.Provider
      value={{
        open,
        openDrawer: () => setOpen(true),
        closeDrawer: () => setOpen(false),
      }}
    >
      {children}
    </ProfileDrawerContext.Provider>
  );
};

export const useProfileDrawer = () => useContext(ProfileDrawerContext);
