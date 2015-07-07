
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS projects;

CREATE TABLE users (id VARCHAR(256), display_name VARCHAR(256), profile_image_url VARCHAR(256));

CREATE TABLE projects (id VARCHAR(256), name VARCHAR(256));
