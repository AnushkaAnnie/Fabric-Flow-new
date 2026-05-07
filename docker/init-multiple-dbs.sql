-- Create databases for each service
CREATE DATABASE master_data_db;
CREATE DATABASE fabric_flow_db;
CREATE DATABASE audit_db;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE master_data_db TO fabric;
GRANT ALL PRIVILEGES ON DATABASE fabric_flow_db TO fabric;
GRANT ALL PRIVILEGES ON DATABASE audit_db TO fabric;
