'''
Takes the Toronto topojson file and creates a .txt file called toronto-bgs.locations.txt
of the format
blockgroup_id,interior_point_lat,interior_point_long

Copy the output of this to router-internal/test/perf/toronto-bgs.locations.txt.
'''
import json

def main(): 

    block_groups = ['id,latitude,longitude']
    with open('toronto.topojson', 'r') as topo:
        for row in topo:
            topojson = json.loads(row)
            polygons = topojson['objects']['-']['geometries']
            for bg in polygons:
                geo_id = bg['properties']['geo_id']
                interior_lat = bg['properties']['INTPTLAT']
                interior_long = bg['properties']['INTPTLON']
                block_groups.append('{},{},{}'.format(geo_id, interior_lat, interior_long))
    with open('toronto-bgs.locations.txt', 'w') as loc:
        for line in block_groups:
            loc.write('{}\n'.format(line))


if __name__ == '__main__':
    main()