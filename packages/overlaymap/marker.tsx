import * as PropTypes from 'prop-types';
import * as React from 'react';

import * as coordinates from '../coordinates';
import * as utils from '../utils';
import {MapContext} from './map';

export interface MarkerProps {
  /** The (lat, lng) position at which to show the marker. */
  position: coordinates.LatLng;

  draggable?: boolean;

  icon?: string; // Path to a marker image URL. Default is a red pin.

  /** Fired when the user drops the marker in a new location. */
  onDragEnd?: (newPosition: coordinates.LatLng) => void;
}

/**
 * A React wrapper around google.maps.Marker.
 * Add this as a child of a Map object to show a marker on a Google map.
 */
export default class Marker extends React.Component<MarkerProps, {}> {
  context: MapContext;
  marker: google.maps.Marker;

  static contextTypes = {
    map: PropTypes.object,
  };

  render(): JSX.Element {
    return null;
  }

  componentWillUnmount() {
    if (this.marker) {
      this.marker.setMap(null);
      this.marker = null;
    }
  }

  makeMarker() {
    if (!this.context.map) return; // no map to add the marker to yet.

    if (this.marker) {
      this.marker.setMap(null);
      this.marker = null;
    }

    const {lat, lng} = this.props.position;
    const position = new google.maps.LatLng(lat, lng);
    this.marker = new google.maps.Marker({
      position,
      map: this.context.map,
      draggable: this.props.draggable,
      animation: google.maps.Animation.DROP,
      icon: this.props.icon,
    });

    this.marker.addListener('dragend', e => {
      if (this.props.onDragEnd) {
        const pos = this.marker.getPosition();
        this.props.onDragEnd(new coordinates.LatLng(pos.lat(), pos.lng()));
      }
    });
  }

  componentDidMount() {
    this.makeMarker();
  }

  componentDidUpdate(prevProps: MarkerProps, prevState: {}, prevContext: any) {
    if (this.context.map !== prevContext.map) {
      this.makeMarker(); // there's a new map object.
    }

    const {lat, lng} = this.props.position;
    this.marker.setPosition(new google.maps.LatLng(lat, lng));
    this.marker.setDraggable(this.props.draggable);
    this.marker.setIcon(this.props.icon);
  }

  shouldComponentUpdate(nextProps: MarkerProps, nextState: {}, nextContext: any): boolean {
    // This check includes children via props.children.
    return (
      !utils.shallowEqual(this.props, nextProps) || !utils.shallowEqual(nextContext, this.context)
    );
  }
}
