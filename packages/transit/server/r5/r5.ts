/**
 * Wrapper around the R5 one-to-many and one-to-one routing API.
 */
import * as request from 'request';
import {
    LatLng,
    TransitEdgeInfo,
    StreetEdgeInfo,
    ProfileOption,
    AnalysisTask,
    ProfileRequest,
    ProfileResponse,
    TransitModes,
    LegMode} from './r5_types';
import {Feature} from '../../../utils';
import {Route, Location, Step} from '../route';
import {QueryOptions} from '../../src/datastore'; // TODO: is this the best way to import query options?

const SECONDS_PER_HOUR = 3600;

async function requestPromise<T>(options: request.CoreOptions & request.UrlOptions): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      request(options, (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          resolve(body);
        }
      });
    });
  }
class R5Router {
    private routerUrl: string;
    
    constructor(url: string) {
        this.routerUrl = url;
    }

    /** Get directions from an origin to a destination (one-to-one). */
    public async getRoute(origin: LatLng, destination: LatLng, options?: QueryOptions): Promise<Route> {
        const req: ProfileRequest = paramsToProfileRequest(origin, destination, options);
        const url = this.routerUrl + '/route';
        const body = await requestPromise<ProfileResponse>({
            url,
            method: 'POST',
            json: true,
            body: req,
        });
        return profileResponseToRoute(origin, destination, body);
    }

    public async getTravelTimes(origin: LatLng, options?: QueryOptions) {
        const req: AnalysisTask = paramsToProfileRequest(origin, null, options);
        req.type = "TRAVEL_TIME_SURFACE";

        const url = this.routerUrl + '/travelTimeMap';
        const body = await requestPromise<ProfileResponse>({
            url,
            method: 'POST',
            json: true,
            body: req,
        });
        return body;
    }
}

function paramsToProfileRequest(origin: LatLng, destination?: LatLng, options?: QueryOptions) : ProfileRequest {
    // Defaults to transit mode
    let transitModes: TransitModes[] = [TransitModes.TRANSIT];
    let directModes: LegMode[] = [LegMode.WALK];

    let req: ProfileRequest = {
        fromLat: origin.lat,
        fromLon: origin.lng,
        date: "2017-10-16",
        // When we add multimodal availability like bike-to-transit, access and egress modes will become options as well.
        accessModes: directModes.join(),
        egressModes: directModes.join(),
        transitModes: transitModes.join(),
        directModes: directModes.join(),
        verbose: true,
    }
    if (destination) {
        req.toLat = destination.lat;
        req.toLon = destination.lng;
    }
    if (options) {
        if (!(options.travel_mode === TransitModes.TRANSIT.toString())) {
            transitModes = [];
            directModes = [(<any>LegMode)[options.travel_mode]];
            req.directModes = directModes.join();
            req.transitModes = transitModes.join();
        }

        if (options.departure_time) {
            const date = `${req.date}T${options.departure_time}`;            
            const departureTime: Date = new Date(0);
            departureTime.setUTCMilliseconds(Date.parse(date));
            const secondsSinceMidnight: number = departureTime.getHours() * SECONDS_PER_HOUR;
            req.fromTime = secondsSinceMidnight;
            req.toTime = secondsSinceMidnight + (2 * SECONDS_PER_HOUR);
        }
        req.wheelchair = options.require_wheelchair;
    }
    
    return req;
}

function profileResponseToRoute(origin: LatLng, destination: LatLng, pr: ProfileResponse): Route {
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

export default R5Router;