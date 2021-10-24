#!/bin/bash
set -e

# Deleting the db_test server removes the test_db which is on it automatically
SERVER="http_pub_sub_db_server_test";


echo "remove old docker [$SERVER]"
(docker kill $SERVER || :) && \
  (docker rm $SERVER || :)