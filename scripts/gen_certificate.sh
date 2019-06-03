#!/bin/bash

helpFunction()
{
   echo ""
   echo "Usage: $0 -c <certificate> -k <key> -d <domain>"
   echo -e "\t-c Root certificate"
   echo -e "\t-k Root key"
   echo -e "\t-d Domain name (Common Name)"
   exit 1 # Exit script after printing help
}

while getopts "c:k:d:n:" opt
do
   case "$opt" in
      c ) cert="$OPTARG" ;;
      k ) key="$OPTARG" ;;
      d ) cn="$OPTARG" ;;
      ? ) helpFunction ;; # Print helpFunction in case parameter is non-existent
   esac
done

# Print helpFunction in case parameters are empty
if [ -z "$cert" ] || [ -z "$key" ] || [ -z "$cn" ]
then
   echo "Some or all of the parameters are empty";
   helpFunction
fi

openssl genrsa -out Coordinator.key 2048

openssl req -new -key Coordinator.key -out Coordinator.csr -subj "/C=GR/ST=Attica/L=Athens/O=ATHENA RIC/OU=IMSI/CN=$cn"

openssl x509 -req -days 1000 -in Coordinator.csr -CA $cert -CAkey $key -set_serial 0101 -out Coordinator.crt -sha256

openssl x509 -in Coordinator.crt -out Coordinator.pem -outform PEM
