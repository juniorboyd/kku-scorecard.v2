FROM nginx:alpine

RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/localhost.key \
        -out /etc/nginx/ssl/localhost.crt \
        -subj "/C=TH/ST=KhonKaen/L=KhonKaen/O=KKU/OU=IT/CN=odt-scorecard.kku.ac.th" \
        -addext "subjectAltName=DNS:localhost,DNS:odt-scorecard.kku.ac.th,IP:127.0.0.1,IP:10.101.118.184"

COPY default.conf /etc/nginx/conf.d/default.conf
