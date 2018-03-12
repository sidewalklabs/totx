import {
    LatLng,
    ProfileResponse,
    TransitEdgeInfo,
    TransitModes,
    StreetEdgeInfo,
    ProfileOption
} from './r5-types';
import {Feature} from '../../../utils';
import {Route, Step} from '../route';

export const SECONDS_PER_HOUR = 3600;

export function profileResponseToRoute(origin: LatLng, destination: LatLng, pr: ProfileResponse): Route {
    if (!pr.options || pr.options.length == 0) {
        return null;
    }

    let option: ProfileOption;
    let fastest = Number.MAX_SAFE_INTEGER;
    let fastestOption = null;
    for (const op of pr.options) {
        const dur = op.itinerary[0].duration;
        if (dur < fastest) {
            fastestOption = op;
            fastest = dur;
        }
    }
    option = fastestOption;

    let {features, steps} = optionToFeaturesAndSteps(option);

    const itinerary = option.itinerary[0];
    const departure_secs_since_midnight = itinerary.startTime.hour * SECONDS_PER_HOUR;
    const arrival_secs_since_midnight = itinerary.endTime.hour * SECONDS_PER_HOUR;
    const duration_secs = itinerary.duration;

    return {
        origin: {
            id: 'origin',
            latitude: origin.lat,
            longitude: origin.lng,
        },
        destination: {
            id: 'destination',
            latitude: destination.lat,
            longitude: destination.lng,
        },
        departureSecs: departure_secs_since_midnight,
        arriveTimeSecs: arrival_secs_since_midnight,
        travelTimeSecs: duration_secs,
        walkingDistanceKm: 0, // fill this in
        steps: steps,
        geojson: {
            type: 'FeatureCollection',
            features,
        },
    };
}

function optionToFeaturesAndSteps(option: ProfileOption): {features: Feature[], steps: Step[]} {
    let features: Array<Feature> = [];
    let steps: Array<Step> = [];
    for (const e of option.access[0].streetEdges) {
        features.push(featureFromStreetEdgeInfo(e));
        steps.push(stepFromStreetEdgeInfo(e));
    }
    if (option.transit != null) {
        for (const s of option.transit) {
            for (const e of s.transitEdges) {
                features.push(featureFromTransitEdgeInfo(e, s.mode));
                steps.push(stepFromTransitEdgeInfo(e, s.mode));
            }
        }
        for (const e of option.egress[0].streetEdges) {
            features.push(featureFromStreetEdgeInfo(e));
            steps.push(stepFromStreetEdgeInfo(e));
        }
    }
    return {features, steps};
}

function featureFromStreetEdgeInfo(e: StreetEdgeInfo): Feature {
    const feature: Feature = {
        geometry: e.geometry,
        type: 'Feature',
        properties: {
            mode: e.mode,
            streetName: e.streetName,
            distance_m: e.distance,
            edgeId: e.edgeId,
        },
    };
    return feature;
}

function featureFromTransitEdgeInfo(e: TransitEdgeInfo, mode: TransitModes): Feature {
    return {
        geometry: e.geometry,
        type: 'Feature',
        properties: {
            mode: mode,
            fromStopID: e.fromStopID,
            toStopID: e.toStopID,
            edgeId: e.id,
            routeId: e.routeID,
            stroke: "#" + e.routeColor,
            tripId: e.routeID, // This needs to be nonzero for routeColor to be shown but the actual value doesn't matter.
        }
    };
}

function stepFromStreetEdgeInfo(e: StreetEdgeInfo): Step {
    const startPoint = e.geometry.coordinates[0];
    const endPoint = e.geometry.coordinates[1];
    
    return {
        from: {
            id: 'origin',
            latitude: startPoint[1], // geojson is in longitude, latitude order
            longitude: startPoint[0],
        },
        to: {
            id: 'destination',
            latitude: endPoint[1], // geojson is in longitude, latitude order
            longitude: endPoint[0],
        },
        mode: e.mode,
        departTimeSecs: 0, // TODO: we don't know how long it takes to walk down one street segment here.
        arriveTimeSecs: 0, // TODO: we don't know how long it takes to walk down one street segment here.
        travelTimeSecs: 0, // TODO: we don't know how long it takes to walk down one street segment here.
        description: e.absoluteDirection + ' on ' + e.streetName,
        distanceKm: e.distance / 1000 / 1000, // convert mm to km
    };
}

function stepFromTransitEdgeInfo(e: TransitEdgeInfo, mode: TransitModes): Step {
    const startPoint = e.geometry.coordinates[0];
    const endPoint = e.geometry.coordinates[1];
    return {
        from: {
            id: 'origin',
            latitude: startPoint[1], // geojson is in longitude, latitude order
            longitude: startPoint[0],
        },
        to: {
            id: 'destination',
            latitude: endPoint[1], // geojson is in longitude, latitude order
            longitude: endPoint[0],
        },
        mode: mode,
        departTimeSecs: 0, // TODO convert from Array<LocalDateTime> to seconds
        arriveTimeSecs: 0, // TODO convert from Array<LocalDateTime> to seconds
        travelTimeSecs: 0, // TODO convert diff between departTimeSecs and arriveTimeSecs
        distanceKm: 0, // TODO add this info
        description: '',
        routeId: e.routeID,
    };
}
