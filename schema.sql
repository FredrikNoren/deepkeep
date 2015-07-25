
DROP TABLE IF EXISTS cached_project_versions;
DROP TABLE IF EXISTS cached_project_validations;
DROP TABLE IF EXISTS logs;

CREATE TABLE cached_project_versions (userid VARCHAR(256), projectname VARCHAR(256), version VARCHAR(256), username VARCHAR(256), readme TEXT);

CREATE TABLE cached_project_validations (userid VARCHAR(256), projectname VARCHAR(256), version VARCHAR(256), validationname VARCHAR(256), status VARCHAR(256));

CREATE TABLE logs (timestamp timestamp, data JSON);
