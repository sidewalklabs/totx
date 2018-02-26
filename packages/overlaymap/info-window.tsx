import * as PropTypes from 'prop-types';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import * as coordinates from '../coordinates';
import * as utils from '../utils';
import {MapContext} from './map';

export interface InfoWindowProps {
  /** The (lat, lng) position at which to show the InfoWindow. */
  position: coordinates.LatLng;

  /** Fired when the user explicitly closed the tooltip. */
  onClose: (event: google.maps.Data.MouseEvent) => void;

  /** The maximum width of the InfoWindow. */
  maxWidth?: number;
}

/**
 * A React wrapper around google.maps.InfoWindow.
 * Add this as a child of a Map object to show a tooltip inside a Google Map. It should have exactly
 * one child, which will be used as the content of the InfoWindow.
 */
export class InfoWindow extends React.Component<InfoWindowProps, {}> {
  context: MapContext;
  infowindow: google.maps.InfoWindow;

  static contextTypes = {
    map: PropTypes.object,
  };

  render(): JSX.Element {
    return null;
  }

  mountInfoWindow() {
    if (this.infowindow) {
      this.infowindow.close();
    }

    if (!this.props.children) {
      return;
    }

    const position = this.props.position;

    this.infowindow = new google.maps.InfoWindow({
      content: document.createElement('div'),
      position: new google.maps.LatLng(position.lat, position.lng),
      maxWidth: this.props.maxWidth,
    });

    ReactDOM.render(
      React.Children.only(this.props.children),
      this.infowindow.getContent() as Element,
    );

    this.infowindow.open(this.context.map);
    this.infowindow.addListener('closeclick', e => {
      if (this.props.onClose) {
        this.props.onClose(e);
      }
    });
  }

  componentWillUnmount() {
    if (this.infowindow) {
      this.infowindow.close();
      ReactDOM.unmountComponentAtNode(this.infowindow.getContent() as Element);
    }
  }

  componentDidMount() {
    this.mountInfoWindow();
  }

  componentDidUpdate() {
    this.mountInfoWindow();
  }

  shouldComponentUpdate(nextProps: InfoWindowProps): boolean {
    // This check includes children via props.children.
    return !utils.shallowEqual(this.props, nextProps);
  }
}
