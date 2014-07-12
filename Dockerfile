FROM orchardup/nginx
ADD html /var/www
CMD 'nginx'