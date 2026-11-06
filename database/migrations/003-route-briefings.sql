-- Latest AI briefing for a saved route. briefing is JSON { summary, terrain, highlights, hazards, tips };
-- the backend regenerates it when generated_at is a few hours old, because weather changes.
CREATE TABLE IF NOT EXISTS route_briefings (
  route_id INT NOT NULL,
  briefing JSON NOT NULL,
  model VARCHAR(64) NOT NULL,
  generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (route_id),
  CONSTRAINT fk_briefing_route FOREIGN KEY (route_id) REFERENCES saved_routes(route_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
