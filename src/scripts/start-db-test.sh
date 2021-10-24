#!/bin/bash
set -e

SERVER="http_pub_sub_db_server_test";
PW="mysecretpassword";
DB="http_pubsub_db_test";

echo "stopping dev db if in case it's using the same 5432 postgres port"
docker stop http_pub_sub_db_server

echo "echo starting new fresh instance of [$SERVER]"
  docker run --name $SERVER -e POSTGRES_PASSWORD=$PW \
  -e PGPASSWORD=$PW \
  -p 5432:5432 \
  -d postgres

# wait for pg to start
echo "sleep wait for pg-server [$SERVER] to start";
sleep 3;

# create the db 
echo "CREATE DATABASE $DB ENCODING 'UTF-8';" | docker exec -i $SERVER psql -U postgres
echo "\l" | docker exec -i $SERVER psql -U postgres