FROM mysql:8.0

# 将初始化脚本复制到容器中
COPY init.sql /docker-entrypoint-initdb.d/

# 设置环境变量（也可以在 docker-compose.yml 中设置）
ENV MYSQL_DATABASE=vue_reading_app
ENV MYSQL_ROOT_PASSWORD=13603994106

EXPOSE 3306