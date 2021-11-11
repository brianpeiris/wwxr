cd "$(dirname "$0")"
cd ../../$1
docker build -t $1 .
docker run -it -v $PWD:/$1 $1 /bin/sh
