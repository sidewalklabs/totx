# overlaymap

This package contains a React-based Google Maps wrapper that displays styled data on an HTML5 Canvas
overlaid on the map. This allows us to display large amounts of data much more efficiently and
flexibly than by using Google Maps' native data functionality. We support selection using an
R-Tree index of the data geometry.

## Usage Example

```
import {OverlayMap, StyledFeatureData} from 'overlaymap';

class MyReactComponent {
  render() {
    const myStyleData: StyledFeatureData = {
      geojson: my_data,
      styleFn: feature => ({
        pointColor: '#ffff00',
        pointRadius: feature.properties.someValue / 100,
      })
    };

    return <OverlayMap data={myStyleData} />;
  }
}
```
