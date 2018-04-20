#!/bin/bash
TIMEFORMAT=%R
echo 'Test	Seconds'
echo -n '1-1 Bicycle 1	'; time curl --silent 'http://localhost:1337/route?%7B%22origin%22%3A%7B%22lat%22%3A43.639609888940925%2C%22lng%22%3A-79.58288876342772%7D%2C%22departureTime%22%3A%228%3A00%3A00%22%2C%22destination%22%3A%7B%22lat%22%3A43.717833733563225%2C%22lng%22%3A-79.31370075936059%7D%2C%22options%22%3A%7B%22departure_time%22%3A%228%3A00%3A00%22%2C%22max_walking_distance_km%22%3A0.8%2C%22walking_speed_kph%22%3A4.8%2C%22max_waiting_time_secs%22%3A1800%2C%22transfer_penalty_secs%22%3A300%2C%22max_number_of_transfers%22%3A1%2C%22travel_mode%22%3A%22BICYCLE%22%2C%22bus_multiplier%22%3A1%2C%22rail_multiplier%22%3A1%2C%22exclude_routes%22%3A%5B%5D%2C%22exclude_stops%22%3A%5B%5D%2C%22require_wheelchair%22%3Afalse%7D%7D' > /dev/null
echo -n '1-1 Bicycle 2	'; time curl --silent 'http://localhost:1337/route?%7B%22origin%22%3A%7B%22lat%22%3A43.639609888940925%2C%22lng%22%3A-79.58288876342772%7D%2C%22departureTime%22%3A%228%3A00%3A00%22%2C%22destination%22%3A%7B%22lat%22%3A43.659493111074575%2C%22lng%22%3A-79.44313343758324%7D%2C%22options%22%3A%7B%22departure_time%22%3A%228%3A00%3A00%22%2C%22max_walking_distance_km%22%3A0.8%2C%22walking_speed_kph%22%3A4.8%2C%22max_waiting_time_secs%22%3A1800%2C%22transfer_penalty_secs%22%3A300%2C%22max_number_of_transfers%22%3A1%2C%22travel_mode%22%3A%22BICYCLE%22%2C%22bus_multiplier%22%3A1%2C%22rail_multiplier%22%3A1%2C%22exclude_routes%22%3A%5B%5D%2C%22exclude_stops%22%3A%5B%5D%2C%22require_wheelchair%22%3Afalse%7D%7D' > /dev/null
echo -n '1-1 Bicycle 3	'; time curl --silent 'http://localhost:1337/route?%7B%22origin%22%3A%7B%22lat%22%3A43.64631795979349%2C%22lng%22%3A-79.38135830688475%7D%2C%22departureTime%22%3A%228%3A00%3A00%22%2C%22destination%22%3A%7B%22lat%22%3A43.717833733563225%2C%22lng%22%3A-79.31370075936059%7D%2C%22options%22%3A%7B%22departure_time%22%3A%228%3A00%3A00%22%2C%22max_walking_distance_km%22%3A0.8%2C%22walking_speed_kph%22%3A4.8%2C%22max_waiting_time_secs%22%3A1800%2C%22transfer_penalty_secs%22%3A300%2C%22max_number_of_transfers%22%3A1%2C%22travel_mode%22%3A%22BICYCLE%22%2C%22bus_multiplier%22%3A1%2C%22rail_multiplier%22%3A1%2C%22exclude_routes%22%3A%5B%5D%2C%22exclude_stops%22%3A%5B%5D%2C%22require_wheelchair%22%3Afalse%7D%7D' > /dev/null
echo -n '1-1 Bicycle 4	'; time curl --silent 'http://localhost:1337/route?%7B%22origin%22%3A%7B%22lat%22%3A43.77660378108596%2C%22lng%22%3A-79.23132626342772%7D%2C%22departureTime%22%3A%228%3A00%3A00%22%2C%22destination%22%3A%7B%22lat%22%3A43.717833733563225%2C%22lng%22%3A-79.31370075936059%7D%2C%22options%22%3A%7B%22departure_time%22%3A%228%3A00%3A00%22%2C%22max_walking_distance_km%22%3A0.8%2C%22walking_speed_kph%22%3A4.8%2C%22max_waiting_time_secs%22%3A1800%2C%22transfer_penalty_secs%22%3A300%2C%22max_number_of_transfers%22%3A1%2C%22travel_mode%22%3A%22BICYCLE%22%2C%22bus_multiplier%22%3A1%2C%22rail_multiplier%22%3A1%2C%22exclude_routes%22%3A%5B%5D%2C%22exclude_stops%22%3A%5B%5D%2C%22require_wheelchair%22%3Afalse%7D%7D' > /dev/null
echo -n '1-N Bicycle 1	'; time curl --silent 'http://localhost:1337/one-to-city?%7B%22origin%22%3A%7B%22lat%22%3A43.64631795979349%2C%22lng%22%3A-79.38135830688475%7D%2C%22departureTime%22%3A%228%3A00%3A00%22%2C%22options%22%3A%7B%22departure_time%22%3A%228%3A00%3A00%22%2C%22max_walking_distance_km%22%3A0.8%2C%22walking_speed_kph%22%3A4.8%2C%22max_waiting_time_secs%22%3A1800%2C%22transfer_penalty_secs%22%3A300%2C%22max_number_of_transfers%22%3A1%2C%22travel_mode%22%3A%22BICYCLE%22%2C%22bus_multiplier%22%3A1%2C%22rail_multiplier%22%3A1%2C%22exclude_routes%22%3A%5B%5D%2C%22exclude_stops%22%3A%5B%5D%2C%22require_wheelchair%22%3Afalse%7D%7D' > /dev/null
echo -n '1-N Bicycle 2	'; time curl --silent 'http://localhost:1337/one-to-city?%7B%22origin%22%3A%7B%22lat%22%3A43.77660378108596%2C%22lng%22%3A-79.23132626342772%7D%2C%22departureTime%22%3A%228%3A00%3A00%22%2C%22options%22%3A%7B%22departure_time%22%3A%228%3A00%3A00%22%2C%22max_walking_distance_km%22%3A0.8%2C%22walking_speed_kph%22%3A4.8%2C%22max_waiting_time_secs%22%3A1800%2C%22transfer_penalty_secs%22%3A300%2C%22max_number_of_transfers%22%3A1%2C%22travel_mode%22%3A%22BICYCLE%22%2C%22bus_multiplier%22%3A1%2C%22rail_multiplier%22%3A1%2C%22exclude_routes%22%3A%5B%5D%2C%22exclude_stops%22%3A%5B%5D%2C%22require_wheelchair%22%3Afalse%7D%7D' > /dev/null
echo -n '1-N Bicycle 3	'; time curl --silent 'http://localhost:1337/one-to-city?%7B%22origin%22%3A%7B%22lat%22%3A43.639609888940925%2C%22lng%22%3A-79.58288876342772%7D%2C%22departureTime%22%3A%228%3A00%3A00%22%2C%22options%22%3A%7B%22departure_time%22%3A%228%3A00%3A00%22%2C%22max_walking_distance_km%22%3A0.8%2C%22walking_speed_kph%22%3A4.8%2C%22max_waiting_time_secs%22%3A1800%2C%22transfer_penalty_secs%22%3A300%2C%22max_number_of_transfers%22%3A1%2C%22travel_mode%22%3A%22BICYCLE%22%2C%22bus_multiplier%22%3A1%2C%22rail_multiplier%22%3A1%2C%22exclude_routes%22%3A%5B%5D%2C%22exclude_stops%22%3A%5B%5D%2C%22require_wheelchair%22%3Afalse%7D%7D' > /dev/null

echo -n '1-N Transit 1	'; time curl --silent 'http://localhost:1337/one-to-city?%7B%22origin%22%3A%7B%22lat%22%3A43.6452%2C%22lng%22%3A-79.3805%7D%2C%22departureTime%22%3A%228%3A00%3A00%22%2C%22options%22%3A%7B%22departure_time%22%3A%228%3A00%3A00%22%2C%22max_walking_distance_km%22%3A0.8%2C%22walking_speed_kph%22%3A4.8%2C%22max_waiting_time_secs%22%3A1800%2C%22transfer_penalty_secs%22%3A300%2C%22max_number_of_transfers%22%3A1%2C%22travel_mode%22%3A%22TRANSIT%22%2C%22bus_multiplier%22%3A1%2C%22rail_multiplier%22%3A1%2C%22exclude_routes%22%3A%5B%5D%2C%22exclude_stops%22%3A%5B%5D%2C%22require_wheelchair%22%3Afalse%7D%7D' > /dev/null
echo -n '1-N Transit 2	'; time curl --silent 'http://localhost:1337/one-to-city?%7B%22origin%22%3A%7B%22lat%22%3A43.6460695260819%2C%22lng%22%3A-79.36453549194334%7D%2C%22departureTime%22%3A%228%3A00%3A00%22%2C%22options%22%3A%7B%22departure_time%22%3A%228%3A00%3A00%22%2C%22max_walking_distance_km%22%3A0.8%2C%22walking_speed_kph%22%3A4.8%2C%22max_waiting_time_secs%22%3A1800%2C%22transfer_penalty_secs%22%3A300%2C%22max_number_of_transfers%22%3A1%2C%22travel_mode%22%3A%22TRANSIT%22%2C%22bus_multiplier%22%3A1%2C%22rail_multiplier%22%3A1%2C%22exclude_routes%22%3A%5B%5D%2C%22exclude_stops%22%3A%5B%5D%2C%22require_wheelchair%22%3Afalse%7D%7D' > /dev/null
echo -n '1-N Transit 3	'; time curl --silent 'http://localhost:1337/one-to-city?%7B%22origin%22%3A%7B%22lat%22%3A43.61351582655186%2C%22lng%22%3A-79.49534146118162%7D%2C%22departureTime%22%3A%228%3A00%3A00%22%2C%22options%22%3A%7B%22departure_time%22%3A%228%3A00%3A00%22%2C%22max_walking_distance_km%22%3A0.8%2C%22walking_speed_kph%22%3A4.8%2C%22max_waiting_time_secs%22%3A1800%2C%22transfer_penalty_secs%22%3A300%2C%22max_number_of_transfers%22%3A1%2C%22travel_mode%22%3A%22TRANSIT%22%2C%22bus_multiplier%22%3A1%2C%22rail_multiplier%22%3A1%2C%22exclude_routes%22%3A%5B%5D%2C%22exclude_stops%22%3A%5B%5D%2C%22require_wheelchair%22%3Afalse%7D%7D' > /dev/null
echo -n '1-N Transit 4	'; time curl --silent 'http://localhost:1337/one-to-city?%7B%22origin%22%3A%7B%22lat%22%3A43.58840513553251%2C%22lng%22%3A-79.64297024536131%7D%2C%22departureTime%22%3A%228%3A00%3A00%22%2C%22options%22%3A%7B%22departure_time%22%3A%228%3A00%3A00%22%2C%22max_walking_distance_km%22%3A0.8%2C%22walking_speed_kph%22%3A4.8%2C%22max_waiting_time_secs%22%3A1800%2C%22transfer_penalty_secs%22%3A300%2C%22max_number_of_transfers%22%3A1%2C%22travel_mode%22%3A%22TRANSIT%22%2C%22bus_multiplier%22%3A1%2C%22rail_multiplier%22%3A1%2C%22exclude_routes%22%3A%5B%5D%2C%22exclude_stops%22%3A%5B%5D%2C%22require_wheelchair%22%3Afalse%7D%7D' > /dev/null
echo -n '1-N Transit 5	'; time curl --silent 'http://localhost:1337/one-to-city?%7B%22origin%22%3A%7B%22lat%22%3A43.64631795979349%2C%22lng%22%3A-79.38135830688475%7D%2C%22departureTime%22%3A%228%3A00%3A00%22%2C%22options%22%3A%7B%22departure_time%22%3A%228%3A00%3A00%22%2C%22max_walking_distance_km%22%3A0.8%2C%22walking_speed_kph%22%3A4.8%2C%22max_waiting_time_secs%22%3A1800%2C%22transfer_penalty_secs%22%3A300%2C%22max_number_of_transfers%22%3A1%2C%22travel_mode%22%3A%22TRANSIT%22%2C%22bus_multiplier%22%3A1%2C%22rail_multiplier%22%3A1%2C%22exclude_routes%22%3A%5B%5D%2C%22exclude_stops%22%3A%5B%5D%2C%22require_wheelchair%22%3Afalse%7D%7D' > /dev/null
echo -n '1-1 Transit 1	'; time curl --silent 'http://localhost:1337/route?%7B%22origin%22%3A%7B%22lat%22%3A43.6452%2C%22lng%22%3A-79.3805%7D%2C%22departureTime%22%3A%228%3A00%3A00%22%2C%22destination%22%3A%7B%22lat%22%3A43.71505051955948%2C%22lng%22%3A-79.40069690747293%7D%2C%22options%22%3A%7B%22departure_time%22%3A%228%3A00%3A00%22%2C%22max_walking_distance_km%22%3A0.8%2C%22walking_speed_kph%22%3A4.8%2C%22max_waiting_time_secs%22%3A1800%2C%22transfer_penalty_secs%22%3A300%2C%22max_number_of_transfers%22%3A1%2C%22travel_mode%22%3A%22TRANSIT%22%2C%22bus_multiplier%22%3A1%2C%22rail_multiplier%22%3A1%2C%22exclude_routes%22%3A%5B%5D%2C%22exclude_stops%22%3A%5B%5D%2C%22require_wheelchair%22%3Afalse%7D%7D' > /dev/null
echo -n '1-1 Transit 2	'; time curl --silent 'http://localhost:1337/route?%7B%22origin%22%3A%7B%22lat%22%3A43.6460695260819%2C%22lng%22%3A-79.36453549194334%7D%2C%22departureTime%22%3A%228%3A00%3A00%22%2C%22destination%22%3A%7B%22lat%22%3A43.71505051955948%2C%22lng%22%3A-79.40069690747293%7D%2C%22options%22%3A%7B%22departure_time%22%3A%228%3A00%3A00%22%2C%22max_walking_distance_km%22%3A0.8%2C%22walking_speed_kph%22%3A4.8%2C%22max_waiting_time_secs%22%3A1800%2C%22transfer_penalty_secs%22%3A300%2C%22max_number_of_transfers%22%3A1%2C%22travel_mode%22%3A%22TRANSIT%22%2C%22bus_multiplier%22%3A1%2C%22rail_multiplier%22%3A1%2C%22exclude_routes%22%3A%5B%5D%2C%22exclude_stops%22%3A%5B%5D%2C%22require_wheelchair%22%3Afalse%7D%7D' > /dev/null
echo -n '1-1 Transit 3	'; time curl --silent 'http://localhost:1337/route?%7B%22origin%22%3A%7B%22lat%22%3A43.61351582655186%2C%22lng%22%3A-79.49534146118162%7D%2C%22departureTime%22%3A%228%3A00%3A00%22%2C%22destination%22%3A%7B%22lat%22%3A43.71505051955948%2C%22lng%22%3A-79.40069690747293%7D%2C%22options%22%3A%7B%22departure_time%22%3A%228%3A00%3A00%22%2C%22max_walking_distance_km%22%3A0.8%2C%22walking_speed_kph%22%3A4.8%2C%22max_waiting_time_secs%22%3A1800%2C%22transfer_penalty_secs%22%3A300%2C%22max_number_of_transfers%22%3A1%2C%22travel_mode%22%3A%22TRANSIT%22%2C%22bus_multiplier%22%3A1%2C%22rail_multiplier%22%3A1%2C%22exclude_routes%22%3A%5B%5D%2C%22exclude_stops%22%3A%5B%5D%2C%22require_wheelchair%22%3Afalse%7D%7D' > /dev/null
echo -n '1-1 Transit 4	'; time curl --silent 'http://localhost:1337/route?%7B%22origin%22%3A%7B%22lat%22%3A43.58840513553251%2C%22lng%22%3A-79.64297024536131%7D%2C%22departureTime%22%3A%228%3A00%3A00%22%2C%22destination%22%3A%7B%22lat%22%3A43.64607916311467%2C%22lng%22%3A-79.3751555323098%7D%2C%22options%22%3A%7B%22departure_time%22%3A%228%3A00%3A00%22%2C%22max_walking_distance_km%22%3A0.8%2C%22walking_speed_kph%22%3A4.8%2C%22max_waiting_time_secs%22%3A1800%2C%22transfer_penalty_secs%22%3A300%2C%22max_number_of_transfers%22%3A1%2C%22travel_mode%22%3A%22TRANSIT%22%2C%22bus_multiplier%22%3A1%2C%22rail_multiplier%22%3A1%2C%22exclude_routes%22%3A%5B%5D%2C%22exclude_stops%22%3A%5B%5D%2C%22require_wheelchair%22%3Afalse%7D%7D' > /dev/null
