# 五子棋 Gomoku

> 專為 Kobo Elipsa 32GB 電子書閱讀器設計的網頁版五子棋遊戲

## 功能

- 15×15 標準棋盤
- 雙人對弈（黑方先手）
- 四方向勝負判斷（橫、縱、左斜、右斜）
- 悔棋（撤回上一步）
- 重新開始
- 勝利 / 平局結果畫面

## 裝置需求

| 項目 | 規格 |
|------|------|
| 目標裝置 | Kobo Elipsa 32GB |
| 螢幕 | 10.3" E Ink Carta 1200，1404 × 1872 px |
| 瀏覽器 | 內建 WebKit（舊版） |

## 技術限制

- 純 ES5（無 arrow function、const/let、template literal）
- 不使用 CSS Grid
- 尺寸全部採用 px
- 無 CSS transition / animation（配合 e-ink 低刷新率）
- 純黑白灰階設計

## 檔案結構

```
gomoku/
├── index.html        # 遊戲主體（HTML + CSS + JS 單一檔案）
├── gomoku-logic.js   # 純遊戲邏輯模組（供測試用）
└── test.js           # TDD 測試套件
```

## 執行方式

直接用瀏覽器開啟 `index.html` 即可遊玩，無需安裝任何套件。

## 執行測試

需要 Node.js：

```bash
node test.js
```

測試涵蓋：棋盤初始化、四方向勝負判斷、落子驗證、悔棋邏輯，共 44 個測試項目。
