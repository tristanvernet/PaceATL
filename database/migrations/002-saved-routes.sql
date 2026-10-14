-- Running routes a signed-in user drew and saved. points is a JSON array of { latitude, longitude }.
CREATE TABLE IF NOT EXISTS saved_routes (
  route_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(80) NOT NULL,
  points JSON NOT NULL,
  distance_meters INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (route_id),
  KEY saved_routes_user_created (user_id, created_at),
  CONSTRAINT fk_saved_route_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
