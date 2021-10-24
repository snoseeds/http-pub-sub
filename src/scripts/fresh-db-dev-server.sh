#!/bin/bash
set -e

# Deleting the db_dev server removes the dev_bd which is on it automatically
SERVER="http_pub_sub_db_server";
PW="mysecretpassword";
DB="http_pubsub_db";

if [ "$(docker ps -qa -f name=$SERVER)" ]; then
    echo ":: Found container - $SERVER"
    if [ "$(docker ps -q -f name=$SERVER)" ]; then
        echo ":: Stopping running container - $SERVER"
        docker stop $SERVER;
    fi
    echo ":: Removing stopped container - $SERVER"
    docker rm $SERVER;
fi

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