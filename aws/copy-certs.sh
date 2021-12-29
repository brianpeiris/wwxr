cd "$(dirname "$0")"
cd ..
mkdir -p site/certs
cd site/certs
cp /etc/letsencrypt/live/wwxr.io/fullchain.pem fullchain.pem
cp /etc/letsencrypt/live/wwxr.io/privkey.pem privkey.pem
chown ubuntu:ubuntu fullchain.pem
chown ubuntu:ubuntu privkey.pem

