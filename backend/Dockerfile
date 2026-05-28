FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=build /out/server /app/server
COPY --from=build /src/migrations /app/migrations
ENV API_ADDR=:8080 DB_DRIVER=sqlite DB_DSN=/data/papers.db PY_SERVICE_URL=http://pyservice:8001
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/app/server"]
