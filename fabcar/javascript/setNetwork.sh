cd ..
./killNetwork.sh 
./startFabric.sh
cd javascript
rm -rf wallet
rm -rf /home/prime/sharedFolder/pi/DHTServer/keyStore
node enrollAdmin.js
node registerUser.js
