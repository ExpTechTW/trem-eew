# TREM EEW

> [!WARNING]
> **屎山警告**
>
> 這是 TREM(臺灣即時地震監測)EEW 伺服器的原始碼。
> 兩年多來邊跑邊改，有 bug 就修，想到什麼就加什麼。沒有測試，沒有文件，全域變數滿天飛，一個檔案上千行，到處都是註解掉沒刪的程式碼。
>
> 現在開源出來給大家參觀。不保證能跑，也不建議拿來學。

## 這是什麼

接收 RTS 測站的即時三軸加速度資料，判斷有沒有地震，有的話估算震央、規模和各地震度，發布 TREM EEW(地震速報),地震結束後再發震度速報和長周期地震動資訊。

| 檔案 | 做什麼 |
|---|---|
| `core/data/realtime.js` | 從 WebSocket 接收測站即時資料 |
| `core/data/replay.js` | 重播模式，從資料庫讀歷史資料 |
| `core/raw.js` | 濾波，計算 PGA / PGV / 震度 |
| `core/rts.js` | 整理各測站即時狀態 |
| `core/trigger.js` | 測站觸發、事件分群、自動凍結異常測站 |
| `core/search.js` | 網格搜尋定位、估計規模與震度分布 |
| `core/eew.js` | 發布 EEW、震度速報，順便發 Discord / Twitter / Threads |
| `core/service/lpgm.js` | 長周期地震動 |
| `core/service/http.js` | HTTP API |
| `core/service/websocket.js` | WebSocket 廣播 |
| `draw.py` | 畫出 EEW 各報規模、震度隨時間的變化 |

## 歷史

**2023/11/28 ~ 2026/03/18**,一共 521 個 commit。

| 時間 | 發生了什麼 |
|---|---|
| 2023/11/28 | 第一個 commit |
| 2023/12 | 10Hz 低通、0.075Hz 高通濾波,Discord webhook |
| 2024/01 | 第一版 EEW、震度計算，分出線上模式和重播模式 |
| 2024/02 | 測站觸發、自動凍結、網格搜尋定位，接上 MariaDB。這個月寫了 169 個 commit,屎山主要就是這時候堆起來的 |
| 2024/04 | 長周期地震動,Twitter |
| 2024/07 | Threads |
| 2024/12 | Docker 化 |
| 2025/01 | 改用 Bun |
| 2026/03/18 | 最後一個 commit |
| 2026/11/02 | 去敏後開源 |

開源前已經把密碼、金鑰、Webhook 都換成環境變數，舊的 git 歷史沒有一起公開。

## 跑起來(如果你堅持)

```bash
cp .env.example .env   # 填入需要的值
bun install
bun index.js
```

或是用 `Dockerfile`。

`config.js` 可以切換 `side`(`LOCAL` / `SERVER`)和 `mode`(`ONLINE` / `REPLAY`)。

程式裡寫死了 `mariadb`、`raw`、`rts-wave` 這些 Docker 內部的服務名稱，原本是跟 ExpTech 其他服務一起部署的，單獨拿出來大概跑不起來。

## 授權

[AGPL-3.0](LICENSE)
