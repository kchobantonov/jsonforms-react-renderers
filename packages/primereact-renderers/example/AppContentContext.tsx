import React, { ReactNode, useMemo, useState } from 'react';

interface AppContentContextType {
  theme: string;
  darkMode: boolean;
  changeTheme: (newTheme: string, dark: boolean) => void;
}

const DEFAULT_THEME = 'lara-light-blue';
const DEFAULT_DARK_MODE = false;

const AppContentContext = React.createContext<AppContentContextType>({
  theme: DEFAULT_THEME,
  darkMode: DEFAULT_DARK_MODE,
  changeTheme: () => {
    // Default implementation (no-op)
    console.warn('changeTheme called without a provider');
  },
});

interface AppContentContextProviderProps {
  children: ReactNode;
}

export const AppContentContextProvider: React.FC<
  AppContentContextProviderProps
> = ({ children }) => {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [darkMode, setDarkMode] = useState(DEFAULT_DARK_MODE);

  const switchTheme = (currentTheme, newTheme, linkElementId, callback) => {
    const linkElement = document.getElementById(
      linkElementId
    ) as HTMLLinkElement;
    const cloneLinkElement = linkElement.cloneNode(true) as HTMLLinkElement;
    const newThemeUrl =
      linkElement.getAttribute('href')?.replace(currentTheme, newTheme) ?? '';

    cloneLinkElement.setAttribute('id', linkElementId + '-clone');
    cloneLinkElement.setAttribute('href', newThemeUrl);
    cloneLinkElement.addEventListener('load', () => {
      linkElement.remove();
      cloneLinkElement.setAttribute('id', linkElementId);

      if (callback) {
        callback();
      }
    });
    linkElement.parentNode?.insertBefore(
      cloneLinkElement,
      linkElement.nextSibling
    );
  };

  const changeTheme = (newTheme: string, dark: boolean) => {
    if (newTheme !== theme) {
      switchTheme(theme, newTheme, 'theme-link', () => {
        setDarkMode(dark);
        setTheme(newTheme);
      });
    }
  };

  const contextValue = useMemo(
    () => ({ theme, darkMode, changeTheme }),
    [theme, darkMode, changeTheme]
  );

  return (
    <AppContentContext.Provider value={contextValue}>
      {children}
    </AppContentContext.Provider>
  );
};

export default AppContentContext;
