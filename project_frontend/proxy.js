const express = require("express");
const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

// Serve frontend files
app.use(express.static(path.join(__dirname)));

// Proxy API requests
app.use(
  "/auth",
  createProxyMiddleware({
    target: "https://probable-space-memory-975p9xwj6jx729pv7-5000.app.github.dev",
    changeOrigin: true,
    secure: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(3000, () => console.log("Proxy running on port 3000"));
