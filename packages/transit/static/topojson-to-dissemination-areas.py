'''
Takes the Toronto topojson file and creates a .txt file called toronto-das.locations.txt
of the format
dissemination_area_id,interior_point_lat,interior_point_long

'''
import json

def main(): 

    dissemination_areas = ['id,latitude,longitude']
    topojson = json.load(open('toronto.topojson'))
    polygons = topojson['objects']['-']['geometries']
    for da in polygons:
        geo_id = da['properties']['geo_id']
        interior_lat = da['properties']['INTPTLAT']
        interior_long = da['properties']['INTPTLON']
        dissemination_areas.append('{},{},{}'.format(geo_id, interior_lat, interior_long))
    with open('toronto-das.locations.txt', 'w') as loc:
        for line in dissemination_areas:
            loc.write('{}\n'.format(line))


if __name__ == '__main__':
    main()
