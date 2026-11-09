CREATE TABLE workouts (
  workout_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  distance_miles DECIMAL(6,2) NULL,
  duration_minutes INT NOT NULL,
  workout_date DATE NOT NULL,
  workout_desc TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (workout_id),
  CONSTRAINT fk_workout_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;