import * as React from 'react';
import * as ReactDOM from 'react-dom';
import 'whatwg-fetch'; // fetch() polyfill.

import createStore, {QueryOptions, State as DatastoreState} from './datastore';
import Legend from './legend';
import MapPanel from './map-panel';
import NotificationBar from './notification-bar';
import RouteDisplay from './route-display';
import RoutingParameters from './routing-parameters';
import TravelModeSelector from './travel-mode-selector';

const ABOUT_URL = 'https://docs.google.com/document/d/1YzZ6xbSuqVFyPolkVk1390vIzY1ktrc5OfNXTG3Enj0';
const FEEDBACK_LINK = 'mailto:totx-feedback@sidewalklabs.com';

const rootEl = document.getElementById('root');
const store = createStore();

interface State extends DatastoreState {
  searchboxInput: string;
}

/** Root component for the transit accessibility visualization. */
class Root extends React.Component<{}, State> {
  searchboxTextRef: any = null;

  constructor(props: {}) {
    super(props);
    this.state = {...store.getState(), searchboxInput: null};
    this.clearError = this.clearError.bind(this);
    this.setOptions = this.setOptions.bind(this);
    this.setTravelMode = this.setTravelMode.bind(this);
    this.setSearchBoxInput = this.setSearchBoxInput.bind(this);
    this.searchboxTextRef = React.createRef();
  }

  render(): JSX.Element {
    const handleAction = store.dispatch.bind(store);

    const {state} = this;
    const {routes, originAddress} = state;
    const clearDestination = () => store.dispatch({type: 'clear-destination'});
    const address = state.searchboxInput === null ? originAddress : state.searchboxInput;
    const isRouteComparison = !!(routes[0] && routes[1]);

    return (
      <div className="view-map">
        <NotificationBar
          error={this.state.error}
          isLoading={this.state.isLoading}
          clearError={this.clearError}
        />
        <MapPanel handleAction={handleAction} {...this.state} />
        <div className="feedback-about hide-on-mobile">
          <a className="mdl-shadow--4dp" href={ABOUT_URL}>
            About
          </a>
          <a className="mdl-shadow--4dp" href={FEEDBACK_LINK}>
            Feedback
          </a>
        </div>
        <div className="left-nav mdl-card mdl-shadow--8dp">
          <div className="mdl-card__title hide-on-mobile">
            <div className="TitleLogo-Super">Toronto Transit</div>
            <div className="TitleLogo">Explorer</div>
            <div className="Title-Subhead">Discovering ways to travel the city</div>
          </div>

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
            onCompare={() => store.dispatch({type: 'set-mode', mode: 'compare-settings'})}
          />

          <div className="nav-bottom">
            <form
              className="origin-destination"
              onSubmit={e => {
                this.geocodeSearchboxInput(address);
                e.preventDefault();
              }}>
              <img src="blue-marker.svg" width={19} height={27} />
              <div className="input-box-addon">
                <input
                  ref={this.searchboxTextRef}
                  className="origin-destination-search-box"
                  value={address || ''}
                  onChange={e => this.setSearchBoxInput(e.target.value)}
                />
                <img src="search-grey.png" width={15} height={15} />
              </div>
            </form>
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

  setSearchBoxInput(value: string) {
    this.setState({searchboxInput: value});
  }

  geocodeSearchboxInput(address: string) {
    store.dispatch({type: 'search-for-address', address});
    this.setState({searchboxInput: null});
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
