package api

import (
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"xcjdev/backend/internal/config"
)

// New 构造 chi 路由。
func New(cfg config.Config, h *Handlers) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{cfg.CORSOrigin, "*"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Route("/api", func(r chi.Router) {
		r.Get("/health", h.Health)
		r.Get("/stats", h.Stats)
		r.Post("/search/traditional", h.SearchTraditional)
		r.Post("/search/smart", h.SearchSmart)
		r.Post("/analyze/generate", h.AnalyzeGenerate)
		r.Post("/analyze/run", h.AnalyzeRun)
		r.Get("/papers/{id}", h.GetPaper)
		r.Get("/papers/{id}/chunks", h.GetPaperChunks)
		r.Get("/history", h.History)
		r.Post("/reload", h.Reindex)
		r.Post("/qa/answer", h.QAAnswer)
		r.Post("/review/auto", h.ReviewAuto)
		r.Post("/review/manual", h.ReviewManual)
		r.Post("/papers/{id}/chat", h.PaperChat)
		r.Post("/papers/{id}/summary", h.PaperSummary)
		r.Post("/papers/{id}/mindmap", h.PaperMindmap)
		r.Post("/papers/{id}/related", h.PaperRelated)
	})

	return r
}

// Run 启动 HTTP 服务，阻塞直至错误。
func Run(addr string, handler http.Handler) error {
	srv := &http.Server{
		Addr:         addr,
		Handler:      handler,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 5 * time.Minute,
		IdleTimeout:  120 * time.Second,
	}
	log.Printf("[api] listening on %s", addr)
	return srv.ListenAndServe()
}
