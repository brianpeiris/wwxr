cd "$(dirname "$0")"
cd ..
docker-compose up --build $1
