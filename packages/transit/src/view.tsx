import * as React from 'react';
import * as ReactDOM from 'react-dom';
import 'whatwg-fetch'; // fetch() polyfill.

import * as actions from './action';
import createStore, {QueryOptions, State} from './datastore';
import Legend from './legend';
import MapPanel from './map-panel';
import NotificationBar from './notification-bar';
import RouteDisplay from './route-display';
import RoutingParameters from './routing-parameters';

const ABOUT_URL = 'https://docs.google.com/document/d/1YzZ6xbSuqVFyPolkVk1390vIzY1ktrc5OfNXTG3Enj0';
const FEEDBACK_LINK = 'mailto:ttx@sidewalklabs.com';

const rootEl = document.getElementById('root');
const store = createStore();

const CompareToAnotherOrigin = (props: {onClick: () => any}) => (
  <div className="mode-switch compare-origin" {...props}>
    <span>+</span>
    Compare to another origin
  </div>
);
const CompareToOtherSettings = (props: {onClick: () => any}) => (
  <div className="mode-switch compare-settings" {...props}>
    <span>+</span>
    Compare to other settings
  </div>
);

/** Root component for the transit accessibility visualization. */
class Root extends React.Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = store.getState();
    this.clearError = this.clearError.bind(this);
    this.setOptions = this.setOptions.bind(this);
  }

  render(): JSX.Element {
    const handleAction = store.dispatch.bind(store);
    const setMode = (mode: actions.Mode) => () => {
      handleAction({type: 'set-mode', mode});
    };

    const {state} = this;
    const {routes} = state;
    const clearDestination = () => store.dispatch({type: 'clear-destination'});

    return (
      <div className="view-map">
        <NotificationBar
          error={this.state.error}
          isLoading={this.state.isLoading}
          clearError={this.clearError}
        />
        <MapPanel handleAction={handleAction} {...this.state} />
        <div className="feedback-about">
          <a className="mdl-shadow--4dp" href={ABOUT_URL}>
            About
          </a>
          <a className="mdl-shadow--4dp" href={FEEDBACK_LINK}>
            Feedback
          </a>
        </div>
        <div className="left-nav mdl-card mdl-shadow--8dp">
          <div className="mdl-card__title">
            <div className="TitleLogo-Super">Toronto Transit</div>
            <div className="TitleLogo">Explorer</div>
            <div className="Title-Subhead">Discovering ways to travel the city</div>
          </div>
          <RouteDisplay className="route" route={routes[0]} onClearDestination={clearDestination} />
          <div className="mode-choice">(Mode choice placeholder)</div>
          <div className="origin">
            <img src="blue-marker.svg" width={19} height={27} /> {this.state.originAddress}
          </div>
          <RoutingParameters
            {...this.state}
            handleAction={handleAction}
            onChange={this.setOptions}
          />
          {this.state.mode === 'single' ? (
            <div className="mode-switchers-container">
              <CompareToAnotherOrigin onClick={setMode('compare-origin')} />
              <CompareToOtherSettings onClick={setMode('compare-settings')} />
            </div>
          ) : null}
        </div>
        <Legend mode={this.state.mode} currentStory={this.state.currentStory} />

        {this.state.currentStory !== null ? (
          <div className="mobile-warning">
            For a better experience, use a tablet or desktop device.
          </div>
        ) : null}
      </div>
    );
  }

  componentDidMount() {
    store.subscribe(() => {
      this.setState(store.getState());
    });
  }

  clearError() {
    store.dispatch({
      type: 'report-error',
      error: null,
    });
  }

  setOptions(which: number, options: Partial<QueryOptions>) {
    store.dispatch({
      type: 'set-options',
      isSecondary: which === 2,
      options,
    });
  }
}

ReactDOM.render(<Root />, rootEl);
