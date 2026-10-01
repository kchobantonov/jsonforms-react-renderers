import React, { useEffect, useState } from 'react';
import { DemoSplitterProps } from '@chobantonov/jsonforms-react-demo-common';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@jsonforms-react-shadcn-ui/resizable';

const stackedLayoutQuery = '(max-width: 1100px)';

export const ShadcnDemoSplitter = ({
  form,
  data,
}: DemoSplitterProps): React.JSX.Element => {
  const [stacked, setStacked] = useState(
    () => window.matchMedia(stackedLayoutQuery).matches
  );

  useEffect(() => {
    const query = window.matchMedia(stackedLayoutQuery);
    const updateLayout = (event: MediaQueryListEvent) =>
      setStacked(event.matches);

    query.addEventListener('change', updateLayout);
    return () => query.removeEventListener('change', updateLayout);
  }, []);

  if (stacked) {
    return (
      <div className='demo-data-layout demo-data-layout-stacked'>
        {form}
        {data}
      </div>
    );
  }

  return (
    <ResizablePanelGroup
      className='demo-data-layout demo-data-splitter'
      orientation='horizontal'
    >
      <ResizablePanel defaultSize='75%' minSize='20%'>
        {form}
      </ResizablePanel>
      <ResizableHandle className='demo-data-splitter-handle' withHandle />
      <ResizablePanel defaultSize='25%' minSize='20%'>
        {data}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
