#!/usr/bin/env bash
set -e
 
echo '>>> Get old container id'
CID=$(sudo docker ps | grep "shoppinglist" | awk '{print $1}')
echo $CID

echo '>>> Building new image'
sudo docker build -t shoppinglist .
 
echo '>>> Stopping old container'
if [ "$CID" != "" ];
then
  sudo docker stop $CID
fi
 
echo '>>> Starting new container'
sudo docker run -p 8087:80 -d shoppinglist
  
echo '>>> Cleaning up containers'
sudo docker ps -a | grep "Exit" | awk '{print $1}' | while read -r id ; do
  sudo docker rm $id
done

echo '>>> Remove untagged images'
RMIS=$(docker images | grep "^<none>" | awk '{print $3}')
if [ "$RMIS" != "" ];
then
  sudo docker rmi $RMIS
fi