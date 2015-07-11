
DROP TABLE IF EXISTS cached_project_versions;

CREATE TABLE cached_project_versions (userid VARCHAR(256), projectname VARCHAR(256), version VARCHAR(256), username VARCHAR(256), readme TEXT);
