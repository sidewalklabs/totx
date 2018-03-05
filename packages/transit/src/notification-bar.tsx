import * as React from 'react';

export interface NotificationBarProps {
  error?: string;
  isLoading?: boolean;
  clearError: () => void;
}

/**
 * A bar overlaid on the top of the window that reports loading state and error messages.
 */
export default class NotificationBar extends React.Component<NotificationBarProps, {}> {
  render(): JSX.Element {
    if (this.props.isLoading) {
      return <div className="loading">Loading…</div>;
    } else if (this.props.error) {
      return (
        <div className="error">
          <span className="error-close" onClick={this.props.clearError}>x</span>
          {this.props.error}
        </div>
      );
    } else {
      return null;
    }
  }
}
