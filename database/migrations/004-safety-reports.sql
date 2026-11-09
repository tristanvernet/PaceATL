-- Hazard reports submitted by signed-in users. status starts as pending until an admin reviews it.
CREATE TABLE IF NOT EXISTS safety_reports (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  route_id INT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  reviewed_by INT NULL,
  PRIMARY KEY (id),
  KEY safety_reports_status_created (status, created_at),
  CONSTRAINT fk_safety_report_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_safety_report_route FOREIGN KEY (route_id) REFERENCES saved_routes(route_id) ON DELETE SET NULL,
  CONSTRAINT fk_safety_report_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
