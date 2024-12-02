import { Button } from 'primereact/button';
import { Toolbar } from 'primereact/toolbar';
import React, { useContext } from 'react';
import AppContentContext from './AppContentContext';

interface HeaderProps {
  onConfigButtonClick: () => void;
}

const Header: React.FC<HeaderProps> = (props) => {
  const { theme, darkMode, changeTheme } = useContext(AppContentContext);

  const toggleDarkMode = () => {
    let newTheme: string | null = null;

    if (darkMode) {
      newTheme = theme.replace('dark', 'light');
    } else if (theme.includes('light') && theme !== 'fluent-light') {
      newTheme = theme.replace('light', 'dark');
    } else {
      newTheme = 'lara-dark-cyan';
    }
    changeTheme(newTheme, !darkMode);
  };

  const endContent = (
    <div className='flex align-items-center gap-2 py-1 px-2'>
      <Button
        icon={darkMode ? 'pi pi-moon' : 'pi pi-sun'}
        onClick={toggleDarkMode}
      />
      <Button icon='pi pi-palette' onClick={props.onConfigButtonClick} />
    </div>
  );

  return (
    <div className='card'>
      <Toolbar end={endContent} />
    </div>
  );
};

export default Header;
