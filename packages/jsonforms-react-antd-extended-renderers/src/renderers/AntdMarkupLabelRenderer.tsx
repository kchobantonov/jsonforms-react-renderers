import { createMarkupLabelRenderer } from '@chobantonov/jsonforms-react-extended-renderers';
import { Typography } from 'antd';
import React from 'react';

/**
 * The markup label, wearing antd's typography.
 *
 * The `block` flag is ignored, and that is the interesting part: antd's
 * `Typography.Paragraph` renders a **`div`**, not a `<p>` (checked - antd's
 * own `component` default for it is `"div"`; `Typography` is an `article` and
 * `Typography.Text` a `span`). So it is safe to wrap parsed Markdown in,
 * which for a library whose paragraph really is a `<p>` it would not be.
 * Using it for both modes keeps the two looking identical, which matters more
 * here than honouring a distinction antd does not draw.
 *
 * `marginBottom: 0`: antd gives a paragraph a bottom margin, which inside a
 * form's own vertical rhythm reads as an unexplained gap under one label. A
 * host that wants the margin back switches `typography` off and styles the
 * text itself, which is what that option is for.
 */
export const AntdMarkupLabelRenderer = createMarkupLabelRenderer(
  ({ children }) => (
    <Typography.Paragraph style={{ marginBottom: 0 }}>
      {children}
    </Typography.Paragraph>
  )
);
