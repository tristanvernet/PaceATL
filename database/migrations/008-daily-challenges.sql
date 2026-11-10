CREATE TABLE IF NOT EXISTS daily_challenges (
  challenge_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  challenge_date DATE NOT NULL UNIQUE,
  title VARCHAR(120) NOT NULL,
  activity_type VARCHAR(10) NOT NULL,
  metric VARCHAR(10) NOT NULL,
  target DECIMAL(10,2) NOT NULL,
  CONSTRAINT chk_daily_target CHECK (target > 0),
  CONSTRAINT chk_daily_activity CHECK (activity_type IN ('run','walk','cycle','any')),
  CONSTRAINT chk_daily_metric CHECK (metric IN ('miles','minutes','workouts'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS daily_challenge_completions (
  completion_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  challenge_id INT NOT NULL,
  completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_challenge (user_id, challenge_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (challenge_id) REFERENCES daily_challenges(challenge_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
