"use client";

import { nanoid } from "nanoid";

const PLAYER_ID_KEY = "secretbug:playerId";
const NICKNAME_KEY = "secretbug:nickname";

export function getOrCreatePlayerId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = nanoid(16);
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

export function getSavedNickname(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(NICKNAME_KEY) ?? "";
}

export function saveNickname(nickname: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NICKNAME_KEY, nickname);
}

export function rememberRoom(roomId: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("secretbug:lastRoom", roomId);
}

export function getRememberedRoom(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("secretbug:lastRoom");
}

export function forgetRoom() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("secretbug:lastRoom");
}
