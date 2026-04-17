# Chibi Arena

https://chibiarena.akiweb8528.net

ブラウザで動作する3D FPSゲームです。
TypeScript + Babylon.js を用いて開発し、軽量かつ拡張しやすい設計を目指しています。

---

## 🎮 概要

Chibi Arena は、シンプルな操作で遊べる3D FPSをベースに、
ゲームロジックと描画処理の責務分離を重視して設計されたWebアプリケーションです。

* ブラウザのみでプレイ可能
* 軽量な構成（Viteベース）
* 拡張しやすいモジュール設計

---

## 🚀 使用技術

* TypeScript
* Babylon.js
* Vite
* GitHub（バージョン管理・レビュー）
* VSCode（開発環境）

---

## 🎯 開発方針

本プロジェクトでは以下を重視しています：

* 常に「プレイ可能な状態」を維持する段階的開発
* ランタイムの正しさを最優先
* 責務の分離とカプセル化
* 副作用の明確な管理

---

## 🧠 設計思想

### カプセル化（Encapsulation）

* 各モジュールが状態を所有
* 外部から直接内部状態を書き換えない
* コマンド・クエリベースのインターフェース設計

### 関心の分離（Separation of Concerns）

以下の責務を明確に分離：

* エンジン初期化
* シーン構築
* 入力処理
* プレイヤー制御
* 戦闘ロジック
* 敵AI
* UI描画
* 永続化 / 通信

### 契約による設計（Design by Contract）

* 前提条件・戻り値を明確化
* 型とインターフェースで安全性を担保
* 暗黙の挙動を排除

### 副作用の分離（Side-effect Isolation）

副作用は以下に限定：

* Babylon.js（描画・物理）
* DOM / ブラウザAPI
* 入力イベント
* サウンド
* 永続化・通信

ゲームロジックは可能な限り純粋関数として実装

---

## 📁 ディレクトリ構成

```
src/
  main.ts
  app/
    createGameApp.ts
  core/
    engine/
    scene/
    assets/
  features/
    player/
    combat/
    enemies/
    ui/
  shared/
    contracts/
    events/
    math/
    utils/
```

※ プロジェクトの成長に応じて柔軟に変更

---


## ⚙️ Babylon.js運用ルール

* engine / scene はファクトリで生成
* グローバル参照を禁止
* すべてのリソースは明示的に dispose
* HMR時の重複登録に注意
* assetパスはVite互換にする

---

## 🧩 コード方針

* TypeScriptを使用
* 1機能 = 1クラスまたはファクトリ
* 依存関係はコンストラクタ注入
* 長寿命オブジェクトは dispose() を持つ
* 不要な抽象化は作らない

---

## 👤 Author

AkiWeb Hakoniwa
Full-stack Web Developer
https://akiweb8528.net

---
