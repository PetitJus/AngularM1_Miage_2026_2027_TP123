import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.js";
import { User } from "../src/models/User.js";
import { Track } from "../src/models/Track.js";

let server, base;

test.before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

test("health sans dépendre de MongoDB", async () => {
  const r = await fetch(base + "/api/health");
  assert.equal(r.status, 200);
  assert.equal((await r.json()).status, "ok");
});

test("schémas Mongoose et relation", () => {
  const u = new User({
    name: "Test",
    email: "TEST@example.com",
    password: "12345678",
  });

  assert.equal(u.email, "test@example.com");
  const t = new Track({
    ownerId: new mongoose.Types.ObjectId(),
    title: "Blues",
    originalName: "b.mp3",
    storedName: "x.mp3",
    mimeType: "audio/mpeg",
    size: 42,
  });
  
  assert.equal(t.title, "Blues");
  assert.equal(Track.schema.path("ownerId").options.ref, "User");
});

// --- TP3 : tests de contrat et de sécurité, sans MongoDB ---
// Chaque requête ci-dessous est rejetée par un middleware (auth ou Multer)
// avant tout accès à la base : aucune connexion MongoDB n'est nécessaire.

/** Fabrique un JWT de test signé avec le même secret que l'application. */
function testToken() {
  const secret = process.env.JWT_SECRET || "tp1-development-secret";
  return jwt.sign(
    { sub: new mongoose.Types.ObjectId().toString(), email: "test@example.com" },
    secret,
    { expiresIn: "5m" },
  );
}

test("401 sans JWT sur une route protégée", async () => {
  const r = await fetch(base + "/api/tracks?page=1&limit=5");
  assert.equal(r.status, 401);
  assert.equal((await r.json()).message, "Authentification requise");
});

test("401 sans JWT sur la suppression d'une piste", async () => {
  const r = await fetch(base + "/api/tracks/000000000000000000000000", {
    method: "DELETE",
  });
  assert.equal(r.status, 401);
});

test("401 avec un JWT invalide", async () => {
  const r = await fetch(base + "/api/tracks?page=1&limit=5", {
    headers: { Authorization: "Bearer ceci.nest.pas-un-jwt" },
  });
  assert.equal(r.status, 401);
  assert.equal((await r.json()).message, "Jeton invalide ou expiré");
});

test("401 avec un JWT signé par un autre secret", async () => {
  const forged = jwt.sign({ sub: "intrus" }, "mauvais-secret");
  const r = await fetch(base + "/api/tracks?page=1&limit=5", {
    headers: { Authorization: `Bearer ${forged}` },
  });
  assert.equal(r.status, 401);
});

test("400 pour un upload sans fichier", async () => {
  const body = new FormData();
  body.append("title", "Sans fichier");
  const r = await fetch(base + "/api/tracks", {
    method: "POST",
    headers: { Authorization: `Bearer ${testToken()}` },
    body,
  });
  assert.equal(r.status, 400);
  assert.equal((await r.json()).message, "Fichier audio requis");
});

test("400 pour un type MIME refusé", async () => {
  const body = new FormData();
  body.append("audio", new Blob(["pas de l'audio"], { type: "text/plain" }), "notes.txt");
  body.append("title", "Texte");
  const r = await fetch(base + "/api/tracks", {
    method: "POST",
    headers: { Authorization: `Bearer ${testToken()}` },
    body,
  });
  assert.equal(r.status, 400);
  assert.equal((await r.json()).message, "Format audio non accepté");
});
