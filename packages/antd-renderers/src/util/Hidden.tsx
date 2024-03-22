import React, { FC, PropsWithChildren } from 'react';

type HiddenProps = {
  hidden: boolean;
};

const Hidden: FC<PropsWithChildren<HiddenProps>> = ({ children, hidden }) => {
  return <>{hidden ? null : children}</>;
};

export default Hidden;
