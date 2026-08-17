FROM nginx

RUN rm -f /etc/nginx/conf.d/default.conf && \
    printf 'server {\n    listen 80;\n    server_name _;\n    root /usr/share/nginx/html;\n    index index.html;\n\n    location / {\n        try_files $uri $uri/ /index.html;\n    }\n}\n' > /etc/nginx/conf.d/default.conf

COPY dist /usr/share/nginx/html
EXPOSE 80