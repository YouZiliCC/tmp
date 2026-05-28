package main

import (
	"log"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"

	"xcjdev/backend/internal/api"
	"xcjdev/backend/internal/config"
	"xcjdev/backend/internal/pyclient"
	"xcjdev/backend/internal/store"
)

func main() {
	_ = godotenv.Load("../.env")
	_ = godotenv.Load(".env")

	cfg := config.Load()
	log.Printf("[boot] driver=%s addr=%s py=%s", cfg.DBDriver, cfg.APIAddr, cfg.PyServiceURL)

	db, err := store.Open(cfg.DBDriver, cfg.DBDSN)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	defer db.Close()

	migDir := resolveMigrations()
	if err := db.Migrate(migDir); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	py := pyclient.New(cfg.PyServiceURL)
	h := &api.Handlers{DB: db, Py: py}
	if err := h.Reload(); err != nil {
		log.Printf("[warn] initial reload: %v", err)
	}

	handler := api.New(cfg, h)
	if err := api.Run(cfg.APIAddr, handler); err != nil {
		log.Fatalf("run: %v", err)
	}
}

// resolveMigrations 根据可执行文件所在目录寻找 migrations 子目录。
func resolveMigrations() string {
	candidates := []string{
		"./migrations",
		"../migrations",
		"../backend/migrations",
	}
	exe, err := os.Executable()
	if err == nil {
		dir := filepath.Dir(exe)
		candidates = append(candidates,
			filepath.Join(dir, "migrations"),
			filepath.Join(dir, "..", "migrations"),
			filepath.Join(dir, "..", "backend", "migrations"),
		)
	}
	for _, p := range candidates {
		if st, err := os.Stat(p); err == nil && st.IsDir() {
			return p
		}
	}
	return "./migrations"
}
