#!/bin/bash
set -e

SERVER="http_pub_sub_db_server";
PW="mysecretpassword";
DB="http_pubsub_db";

echo "starting container in case it's not up"
docker start http_pub_sub_db_server


# wait for pg to start
echo "sleep wait for pg-server [$SERVER] to start";
sleep 3;