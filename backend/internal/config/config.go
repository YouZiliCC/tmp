package config

import (
	"os"
	"strconv"
)

type Config struct {
	DBDriver       string
	DBDSN          string
	APIAddr        string
	CORSOrigin     string
	PyServiceURL   string
	LLMModel       string
	LLMTemperature float64
	EmbedModel     string
}

func Load() Config {
	c := Config{
		DBDriver:       getenv("DB_DRIVER", "sqlite"),
		DBDSN:          getenv("DB_DSN", "./data/storage/papers.db"),
		APIAddr:        getenv("API_ADDR", ":8080"),
		CORSOrigin:     getenv("CORS_ORIGIN", "http://localhost:5173"),
		PyServiceURL:   getenv("PY_SERVICE_URL", "http://127.0.0.1:8001"),
		LLMModel:       getenv("LLM_MODEL", "gpt-4o-mini"),
		LLMTemperature: getfloat("LLM_TEMPERATURE", 0.2),
		EmbedModel:     getenv("EMBED_MODEL", "BAAI/bge-small-zh-v1.5"),
	}
	return c
}

func getenv(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}

func getfloat(k string, d float64) float64 {
	if v := os.Getenv(k); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			return f
		}
	}
	return d
}
