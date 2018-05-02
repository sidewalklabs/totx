import * as React from 'react';
import * as ReactDOM from 'react-dom';
import 'whatwg-fetch'; // fetch() polyfill.

import createStore, {QueryOptions, State} from './datastore';
import Legend from './legend';
import MapPanel from './map-panel';
import NotificationBar from './notification-bar';
import RouteDisplay from './route-display';
import RoutingParameters from './routing-parameters';
import TravelModeSelector from './travel-mode-selector';

const ABOUT_URL = 'https://docs.google.com/document/d/1YzZ6xbSuqVFyPolkVk1390vIzY1ktrc5OfNXTG3Enj0';
const FEEDBACK_LINK = 'mailto:ttx@sidewalklabs.com';

const rootEl = document.getElementById('root');
const store = createStore();

/** Root component for the transit accessibility visualization. */
class Root extends React.Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = store.getState();
    this.clearError = this.clearError.bind(this);
    this.setOptions = this.setOptions.bind(this);
    this.setTravelMode = this.setTravelMode.bind(this);
  }

  render(): JSX.Element {
    const handleAction = store.dispatch.bind(store);

    const {state} = this;
    const {mode, routes} = state;
    const clearDestination = () => store.dispatch({type: 'clear-destination'});
    const isRouteComparison = !!(routes[0] && routes[1]);

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

          {mode === 'single' ? (
            <div className="compare-button-wrapper">
              <div
                className="compare-button"
                onClick={() => store.dispatch({type: 'set-mode', mode: 'compare-settings'})}
              />
            </div>
          ) : null}

          {routes[0] ? (
            <RouteDisplay
              className="route route-primary"
              isComparison={isRouteComparison}
              route={routes[0]}
              onClearDestination={clearDestination}
            />
          ) : null}
          {routes[1] ? (
            <RouteDisplay
              className="route route-secondary"
              isComparison={isRouteComparison}
              route={routes[1]}
            />
          ) : null}

          <TravelModeSelector
            mode={state.mode}
            travelMode={state.options.travel_mode}
            travelMode2={state.options2.travel_mode}
            onChange={this.setTravelMode}
            onClear={() => store.dispatch({type: 'set-mode', mode: 'single'})}
          />

          <div className="nav-bottom">
            <div className="origin-destination">
              <img src="blue-marker.svg" width={19} height={27} /> {this.state.originAddress}
              <div>TODO: AP-199</div>
            </div>
            <hr />
            <RoutingParameters
              {...this.state}
              handleAction={handleAction}
              onChange={this.setOptions}
            />
            <hr />
            <Legend
              mode={this.state.mode}
              travelMode={this.state.options.travel_mode}
              travelMode2={this.state.options2.travel_mode}
            />
          </div>
        </div>

        {this.state.currentStory !== null ? (
          <div className="mobile-warning">
            For a better experience, use a tablet or desktop device.
          </div>
        ) : null}

        <a href="https://sidewalklabs.com/" className="sidewalk-logo">
          <img src="sidewalklabs_logo_primary_grey.png" height="22" />
        </a>
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

  setTravelMode(newMode: string, isSecondary: boolean) {
    store.dispatch({
      type: 'set-options',
      isSecondary,
      options: {
        travel_mode: newMode,
      },
    });
  }
}

ReactDOM.render(<Root />, rootEl);
